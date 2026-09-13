import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";

/** VanBlog 单篇文章结构 */
interface VanBlogArticle {
  id: number;
  title: string;
  content: string;
  tags?: string[];
  category?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  viewer?: number;
  visited?: number;
  top?: number;
  hidden?: boolean;
  private?: boolean;
  pathname?: string;
}

/** VanBlog meta.links 友链项 */
interface VanBlogLink {
  url?: string;
  name?: string;
  desc?: string;
  logo?: string;
  updatedAt?: string;
}

/** VanBlog 根结构 */
interface VanBlogData {
  articles?: VanBlogArticle[];
  tags?: string[];
  categories?: string[];
  meta?: {
    links?: VanBlogLink[];
    [k: string]: unknown;
  };
}

const EXCERPT_MAX_LEN = 50;

/**
 * 从正文生成简介：优先取 <!-- more --> 前的内容，合并空白后取前 N 字
 */
function buildExcerpt(content: string | undefined, maxLen: number = EXCERPT_MAX_LEN): string | null {
  const raw = (content ?? "").trim();
  if (!raw) return null;
  const part = raw.split("<!-- more -->")[0];
  let text = (part ?? raw).trim();
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.slice(0, maxLen) || null;
}

/**
 * VanBlog 数据导入
 * 解析根节点 articles、tags、categories、meta.links，导入为当前系统的分类、标签、文章、友链。
 * 映射：articles[].pathname（优先）或 id → 文章 slug；分类/标签名称即 slug；meta.links → 友链。
 */
export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAdmin(event);

    const body = await readBody(event);
    const jsonData = body?.jsonData;

    if (!jsonData) {
      return error("请提供 VanBlog JSON 数据");
    }

    let data: VanBlogData;
    try {
      data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
    } catch (err: any) {
      return error("JSON 格式错误: " + err.message);
    }

    const articles = Array.isArray(data?.articles) ? data.articles : [];
    const rootTags = Array.isArray(data?.tags) ? data.tags : [];
    const rootCategories = Array.isArray(data?.categories) ? data.categories : [];
    const links = Array.isArray(data?.meta?.links) ? data.meta.links : [];

    const hasAny =
      articles.length > 0 ||
      rootTags.length > 0 ||
      rootCategories.length > 0 ||
      links.length > 0;

    if (!hasAny) {
      return error(
        "VanBlog 数据中未找到可导入内容（需包含 articles / tags / categories / meta.links 至少其一）"
      );
    }

    const authorId = authUser.id;

    const defaultLang = await prisma.language.findFirst({
      where: { isDefault: true },
    });
    const languageCode = defaultLang?.code ?? "zh";

    const toDate = (v: unknown): Date | null => {
      if (!v) return null;
      if (v instanceof Date) return v;
      if (typeof v === "string") return new Date(v);
      return null;
    };

    const stats = {
      categories: { created: 0, skipped: 0 },
      tags: { created: 0, skipped: 0 },
      articleBases: { created: 0, skipped: 0 },
      articleContents: { created: 0, skipped: 0 },
      friendLinks: { created: 0, skipped: 0 },
    };

    const categoryNames = new Set<string>(rootCategories.map((c) => String(c).trim()).filter(Boolean));
    const tagNames = new Set<string>(rootTags.map((t) => String(t).trim()).filter(Boolean));
    for (const a of articles) {
      if (a.category && String(a.category).trim()) categoryNames.add(String(a.category).trim());
      if (Array.isArray(a.tags)) a.tags.forEach((t) => tagNames.add(String(t).trim()));
    }

    await prisma.$transaction(
      async (tx) => {
        for (const name of categoryNames) {
          const slug = name;
          const existing = await tx.category.findUnique({
            where: { slug_languageCode: { slug, languageCode } },
          });
          if (existing) {
            stats.categories.skipped++;
            continue;
          }
          try {
            await tx.category.create({
              data: {
                slug,
                name,
                languageCode,
                sortOrder: 0,
                isActive: true,
              },
            });
            stats.categories.created++;
          } catch (e) {
            stats.categories.skipped++;
          }
        }

        for (const name of tagNames) {
          const slug = name;
          const existing = await tx.tag.findUnique({
            where: { slug_languageCode: { slug, languageCode } },
          });
          if (existing) {
            stats.tags.skipped++;
            continue;
          }
          try {
            await tx.tag.create({
              data: {
                slug,
                name,
                languageCode,
              },
            });
            stats.tags.created++;
          } catch (e) {
            stats.tags.skipped++;
          }
        }

        for (const art of articles) {
          const slugFromPathname = art.pathname?.trim();
          const slug = slugFromPathname || String(art.id);
          const isPublished = !art.hidden && !art.private;
          const categorySlug = art.category && String(art.category).trim() ? String(art.category).trim() : null;
          const tagSlugs = Array.isArray(art.tags) ? art.tags.map((t) => String(t).trim()).filter(Boolean) : [];
          const tagsJson = tagSlugs.length ? JSON.stringify(tagSlugs) : null;

          const existingContent = await tx.articleContent.findUnique({
            where: { slug_languageCode: { slug, languageCode } },
          });
          if (existingContent) {
            stats.articleBases.skipped++;
            stats.articleContents.skipped++;
            continue;
          }

          try {
            const base = await tx.articleBase.create({
              data: {
                authorId,
                categorySlug,
                tags: tagsJson,
                status: isPublished ? "PUBLISHED" : "DRAFT",
                isPublished,
                publishedAt: isPublished ? toDate(art.createdAt) : null,
                viewCount: art.viewer ?? art.visited ?? 0,
                pinOrder: art.top ?? 0,
                createdAt: toDate(art.createdAt) ?? new Date(),
                updatedAt: toDate(art.updatedAt) ?? new Date(),
              },
            });
            stats.articleBases.created++;

            await tx.articleContent.create({
              data: {
                articleBaseId: base.id,
                languageCode,
                slug,
                title: art.title?.trim() || slug,
                content: art.content ?? "",
                excerpt: buildExcerpt(art.content),
                createdAt: toDate(art.createdAt) ?? new Date(),
                updatedAt: toDate(art.updatedAt) ?? new Date(),
              },
            });
            stats.articleContents.created++;
          } catch (e) {
            stats.articleBases.skipped++;
            stats.articleContents.skipped++;
          }
        }

        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          const url = link?.url?.trim();
          const name = link?.name?.trim();
          if (!url || !name) {
            stats.friendLinks.skipped++;
            continue;
          }
          const existingLink = await tx.friendLink.findFirst({
            where: { url, name },
          });
          if (existingLink) {
            stats.friendLinks.skipped++;
            continue;
          }
          try {
            await tx.friendLink.create({
              data: {
                url,
                name,
                description: link?.desc?.trim() || null,
                icon: link?.logo?.trim() || null,
                isActive: true,
                sortOrder: i,
              },
            });
            stats.friendLinks.created++;
          } catch (e) {
            stats.friendLinks.skipped++;
          }
        }
      },
      { maxWait: 60_000, timeout: 10 * 60_000 }
    );

    return success(
      {
        stats: {
          categories: stats.categories,
          tags: stats.tags,
          articleBases: stats.articleBases,
          articleContents: stats.articleContents,
          friendLinks: stats.friendLinks,
        },
      },
      "VanBlog 导入完成"
    );
  } catch (err: any) {
    console.error("VanBlog 导入失败:", err);
    return error(err.message || "VanBlog 导入失败");
  }
});
