import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY } from "~~/server/utils/config-keys";

/**
 * 规范化URL（去除首尾空格，统一格式）
 */
function normalizeUrl(url: string): string {
  if (!url) return "";
  return url.trim();
}

/**
 * 从Markdown内容中提取所有图片URL
 * 支持格式：![alt](url) 或 ![alt text](url)
 */
function extractImageUrlsFromMarkdown(content: string): string[] {
  if (!content) return [];

  const imageUrls: string[] = [];
  // 匹配Markdown图片格式：![alt](url)
  // 支持多行匹配，使用非贪婪匹配
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const url = normalizeUrl(match[2]);
    if (url) {
      imageUrls.push(url);
    }
  }

  return imageUrls;
}

/**
 * 从URL中提取objectKey（如果是R2 URL）
 * 例如：https://domain.com/media/filename.webp -> media/filename.webp
 * 支持相对路径：/media/filename.webp -> media/filename.webp
 */
function extractObjectKeyFromUrl(
  url: string,
  r2Domain: string | null
): string | null {
  if (!url) return null;

  // 如果是相对路径（以 / 开头），直接提取路径部分
  if (url.startsWith("/")) {
    // 移除开头的 /，返回路径
    return url.substring(1);
  }

  // 如果有R2域名配置，尝试匹配
  if (r2Domain) {
    // 移除协议和域名，获取路径
    const domainPattern = r2Domain
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");

    // 匹配完整URL：https://domain.com/path -> path
    const urlPattern = new RegExp(
      `^https?://${domainPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(.+)`,
      "i"
    );
    const match = url.match(urlPattern);

    if (match && match[1]) {
      return match[1];
    }

    // 如果URL直接以域名路径开头（无协议）
    if (url.startsWith(domainPattern + "/")) {
      return url.substring(domainPattern.length + 1);
    }
  }

  // 如果无法匹配，返回null（使用完整URL作为path）
  return null;
}

/**
 * 尝试从URL获取文件信息（通过HTTP HEAD请求）
 * 添加超时控制，避免长时间等待
 */
async function getFileInfoFromUrl(url: string): Promise<{
  size: number | null;
  mimeType: string | null;
}> {
  try {
    // 创建带超时的AbortController（5秒超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const contentLength = response.headers.get("content-length");
      const contentType = response.headers.get("content-type");
      return {
        size: contentLength ? parseInt(contentLength, 10) : null,
        mimeType: contentType || null,
      };
    }
  } catch (err) {
    // 忽略错误（超时、网络错误等），返回默认值
  }
  return { size: null, mimeType: null };
}

/**
 * 从文件名或URL中提取文件名
 */
function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split("/").pop() || "image";
    return filename;
  } catch {
    // 如果不是有效URL，尝试直接提取文件名
    const parts = url.split("/");
    return parts[parts.length - 1] || "image";
  }
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);

    // 优化：先用数据库查询筛选包含图片URL的记录，大幅减少需要处理的数据量
    // 1. 查询包含封面图的文章（featuredImage不为空）
    const [articleBasesWithImages, articleContentsWithImages] =
      await Promise.all([
        // 查询有封面图的文章
        prisma.articleBase.findMany({
          where: {
            featuredImage: {
              not: null,
            },
          },
          select: {
            id: true,
            featuredImage: true,
            authorId: true,
          },
        }),
        // 查询正文中包含图片链接的文章（包含 https://、http:// 或 ![ 的内容）
        prisma.articleContent.findMany({
          where: {
            OR: [
              { content: { contains: "https://" } },
              { content: { contains: "http://" } },
              { content: { contains: "![" } },
              { content: { contains: "/media/" } }, // 相对路径
            ],
          },
          select: {
            id: true,
            articleBaseId: true,
            content: true,
          },
        }),
      ]);

    // 收集所有图片URL（使用规范化后的URL作为key）
    const imageUrls = new Set<string>();

    // 1. 收集封面图（已经筛选过，直接处理）
    for (const base of articleBasesWithImages) {
      if (base.featuredImage) {
        const normalizedUrl = normalizeUrl(base.featuredImage);
        if (normalizedUrl) {
          imageUrls.add(normalizedUrl);
        }
      }
    }

    // 2. 收集正文中的图片（已经筛选过包含图片链接的内容）
    for (const content of articleContentsWithImages) {
      const urls = extractImageUrlsFromMarkdown(content.content || "");
      urls.forEach((url) => {
        const normalizedUrl = normalizeUrl(url);
        if (normalizedUrl) {
          imageUrls.add(normalizedUrl);
        }
      });
    }

    // 获取R2域名配置（用于判断是否是内部URL）
    const r2Domain = configCache.get(CONFIG_KEY.R2_DOMAIN);

    // 获取已存在的媒体URL（用于去重，需要规范化URL）
    const existingMedia = await prisma.media.findMany({
      where: {
        uploaderId: user.id,
      },
      select: {
        url: true,
      },
    });
    // 创建规范化URL的集合，用于去重
    const existingUrls = new Set(
      existingMedia
        .map((m: { url: string }) => normalizeUrl(m.url))
        .filter((url: string) => url)
    );

    // 过滤出需要添加的URL（去重）
    const urlsToAdd = Array.from(imageUrls).filter((url) => {
      // 过滤掉空URL
      if (!url) return false;
      const normalizedUrl = normalizeUrl(url);
      if (!normalizedUrl) return false;
      // 过滤掉已存在的URL（使用规范化后的URL进行比较）
      if (existingUrls.has(normalizedUrl)) return false;
      return true;
    });

    // 统计信息
    const stats = {
      totalArticlesScanned:
        articleBasesWithImages.length + articleContentsWithImages.length,
      articlesWithFeaturedImage: articleBasesWithImages.length,
      contentsWithImages: articleContentsWithImages.length,
      totalImages: imageUrls.size,
      existing: existingUrls.size,
      toAdd: urlsToAdd.length,
    };

    if (urlsToAdd.length === 0) {
      return success({
        ...stats,
        added: 0,
        failed: 0,
        skipped: imageUrls.size - existingUrls.size,
      });
    }

    // 优化：批量创建媒体记录，移除HTTP请求（这是最慢的部分）
    // 直接从URL推断文件类型，不等待HTTP响应
    const mediaDataToCreate = urlsToAdd.map((url) => {
      // 提取文件名
      const filename = extractFilenameFromUrl(url);
      const originalName = filename;

      // 尝试提取objectKey（如果是R2 URL）
      const objectKey = extractObjectKeyFromUrl(url, r2Domain);

      // 从URL推断MIME类型（常见图片扩展名）
      let mimeType = "image/jpeg"; // 默认值
      const urlLower = url.toLowerCase();
      if (urlLower.includes(".webp")) mimeType = "image/webp";
      else if (urlLower.includes(".png")) mimeType = "image/png";
      else if (urlLower.includes(".gif")) mimeType = "image/gif";
      else if (urlLower.includes(".svg")) mimeType = "image/svg+xml";
      else if (urlLower.includes(".jpg") || urlLower.includes(".jpeg"))
        mimeType = "image/jpeg";

      return {
        userId: user.id,
        uploaderId: user.id,
        filename: filename,
        originalName: originalName,
        mimeType: mimeType,
        size: 0, // 不获取文件大小，避免HTTP请求
        path: objectKey || url,
        url: url,
        alt: null,
        caption: null,
        metadata: null,
      };
    });

    // 批量创建（使用事务或批量插入）
    let successCount = 0;
    let failCount = 0;

    // 分批处理，每批100条，避免一次性插入过多数据
    const batchSize = 100;
    for (let i = 0; i < mediaDataToCreate.length; i += batchSize) {
      const batch = mediaDataToCreate.slice(i, i + batchSize);
      try {
        // 使用 createMany 批量插入（更快）
        await prisma.media.createMany({
          data: batch,
          skipDuplicates: true, // 跳过重复的URL
        });
        successCount += batch.length;
      } catch (err: any) {
        // 如果批量插入失败，尝试逐个插入
        console.error(`批量创建失败，尝试逐个创建:`, err);
        for (const data of batch) {
          try {
            await prisma.media.create({
              data: data,
            });
            successCount++;
          } catch (singleErr: any) {
            // 检查是否是重复错误
            if (singleErr.code === "P2002") {
              // 唯一约束冲突，说明已存在，不算失败
              successCount++;
            } else {
              console.error(`创建媒体记录失败 (URL: ${data.url}):`, singleErr);
              failCount++;
            }
          }
        }
      }
    }

    return success({
      ...stats,
      added: successCount,
      failed: failCount,
      skipped: imageUrls.size - existingUrls.size - successCount - failCount,
    });
  } catch (err: any) {
    return error(err.message || "扫描失败");
  }
});
