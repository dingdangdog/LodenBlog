import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth } from "~~/server/utils/permission";

// 简单的 slug 生成函数
function generateSlug(text: string): string {
  if (!text) return "";

  // 对于中文，使用简单的转换方案
  // 实际项目中可以使用 pinyin 库（如 pinyin-pro）进行更准确的转换
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/[\u4e00-\u9fa5]/g, (char) => {
      // 使用字符的 Unicode 编码作为临时标识
      // 注意：这不是真正的拼音，但可以保证唯一性
      return `c${char.charCodeAt(0).toString(36)}`;
    })
    .replace(/[^\w\s-]/g, "") // 移除特殊字符
    .replace(/\s+/g, "-") // 空格替换为连字符
    .replace(/-+/g, "-") // 多个连字符合并为一个
    .replace(/^-|-$/g, ""); // 移除首尾连字符

  return slug;
}

export default defineEventHandler(async (event) => {
  try {
    // 需要管理员权限
    const user = await requireAuth(event);

    const body = await readBody(event);
    const { jsonData, languageCode } = body;

    if (!jsonData) {
      return error("JSON 数据不能为空");
    }

    if (!languageCode) {
      return error("语言代码不能为空");
    }

    // 验证语言代码是否存在
    const language = await prisma.language.findUnique({
      where: { code: languageCode },
      select: { code: true },
    });
    if (!language) {
      return error("语言不存在");
    }

    let data;
    try {
      data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
    } catch (err: any) {
      return error("JSON 格式错误: " + err.message);
    }

    // 统计信息
    const stats = {
      categories: { created: 0, skipped: 0 },
      tags: { created: 0, skipped: 0 },
      articles: { created: 0, skipped: 0 },
    };

    // 用于存储已创建的分类和标签的映射（name -> slug）
    const categorySlugMap = new Map<string, string>();
    const tagSlugMap = new Map<string, string>();

    // 使用事务处理所有数据
    await prisma.$transaction(async (tx: any) => {
      // 1. 处理分类
      if (data.categories && Array.isArray(data.categories)) {
        for (const categoryName of data.categories) {
          if (!categoryName || typeof categoryName !== "string") {
            continue;
          }

          const slug = generateSlug(categoryName);

          // 检查是否已存在
          const existing = await tx.category.findUnique({
            where: {
              slug_languageCode: {
                slug,
                languageCode,
              },
            },
          });

          if (existing) {
            stats.categories.skipped++;
            categorySlugMap.set(categoryName, existing.slug);
            continue;
          }

          // 创建分类
          try {
            const category = await tx.category.create({
              data: {
                slug,
                name: categoryName,
                languageCode,
                isActive: true,
                sortOrder: 0,
              },
            });
            stats.categories.created++;
            categorySlugMap.set(categoryName, category.slug);
          } catch (err: any) {
            console.error(`创建分类失败: ${categoryName}`, err);
            stats.categories.skipped++;
          }
        }
      }

      // 2. 处理标签
      if (data.tags && Array.isArray(data.tags)) {
        for (const tagName of data.tags) {
          if (!tagName || typeof tagName !== "string") {
            continue;
          }

          const slug = generateSlug(tagName);

          // 检查是否已存在
          const existing = await tx.tag.findUnique({
            where: {
              slug_languageCode: {
                slug,
                languageCode,
              },
            },
          });

          if (existing) {
            stats.tags.skipped++;
            tagSlugMap.set(tagName, existing.slug);
            continue;
          }

          // 创建标签
          try {
            const tag = await tx.tag.create({
              data: {
                slug,
                name: tagName,
                languageCode,
              },
            });
            stats.tags.created++;
            tagSlugMap.set(tagName, tag.slug);
          } catch (err: any) {
            console.error(`创建标签失败: ${tagName}`, err);
            stats.tags.skipped++;
          }
        }
      }

      // 3. 处理文章
      if (data.articles && Array.isArray(data.articles)) {
        for (const article of data.articles) {
          if (!article.title || !article.content) {
            stats.articles.skipped++;
            continue;
          }

          // 生成文章 slug
          const articleSlug = generateSlug(article.title);

          // 检查是否已存在相同 slug 的文章
          const existingArticle = await tx.articleContent.findFirst({
            where: {
              slug: articleSlug,
              languageCode,
            },
          });

          if (existingArticle) {
            stats.articles.skipped++;
            continue;
          }

          // 处理分类 slug
          let categorySlug: string | null = null;
          if (article.category) {
            const catSlug = categorySlugMap.get(article.category);
            if (catSlug) {
              categorySlug = catSlug;
            } else {
              // 如果分类映射中没有，尝试查找
              const foundCategory = await tx.category.findFirst({
                where: {
                  name: article.category,
                  languageCode,
                },
              });
              if (foundCategory) {
                categorySlug = foundCategory.slug;
                categorySlugMap.set(article.category, foundCategory.slug);
              }
            }
          }

          // 处理标签 slugs
          const tagSlugs: string[] = [];
          if (article.tags && Array.isArray(article.tags)) {
            for (const tagName of article.tags) {
              const tagSlug = tagSlugMap.get(tagName);
              if (tagSlug) {
                tagSlugs.push(tagSlug);
              } else {
                // 如果标签映射中没有，尝试查找
                const foundTag = await tx.tag.findFirst({
                  where: {
                    name: tagName,
                    languageCode,
                  },
                });
                if (foundTag) {
                  tagSlugs.push(foundTag.slug);
                  tagSlugMap.set(tagName, foundTag.slug);
                }
              }
            }
          }

          // 创建文章
          try {
            // 创建 ArticleBase
            const articleBase = await tx.articleBase.create({
              data: {
                authorId: user.id,
                categorySlug: categorySlug || null,
                tags: tagSlugs.length > 0 ? JSON.stringify(tagSlugs) : null,
                status: article.hidden ? "ARCHIVED" : "PUBLISHED",
                isPublished: !article.hidden,
                publishedAt: article.createdAt
                  ? new Date(article.createdAt)
                  : new Date(),
                viewCount: article.viewer || 0,
              },
            });

            // 创建 ArticleContent
            await tx.articleContent.create({
              data: {
                articleBaseId: articleBase.id,
                languageCode,
                slug: articleSlug,
                title: article.title,
                content: article.content,
                excerpt: null, // 可以从 content 中提取
                seoTitle: null,
                seoDescription: null,
                seoKeyword: null,
              },
            });

            stats.articles.created++;
          } catch (err: any) {
            console.error(`创建文章失败: ${article.title}`, err);
            stats.articles.skipped++;
          }
        }
      }
    });

    return success(
      {
        stats,
        message: `导入完成: 分类 ${stats.categories.created} 个, 标签 ${stats.tags.created} 个, 文章 ${stats.articles.created} 篇`,
      },
      "导入成功"
    );
  } catch (err: any) {
    console.error("导入失败:", err);
    return error(err.message || "导入失败");
  }
});
