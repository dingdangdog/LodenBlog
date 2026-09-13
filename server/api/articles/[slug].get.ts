import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const slugParam = getRouterParam(event, "slug");
    const query = getQuery(event);
    const languageCode = (query.languageCode as string) || "";

    if (!slugParam) {
      return error("文章 slug 不能为空");
    }

    // slug 统一转为小写
    const slug = slugParam.toLowerCase();

    let articleContent: any = null;
    let articleBase: any = null;

    // 首先尝试通过 slug + languageCode 查找
    if (languageCode) {
      articleContent = await prisma.articleContent.findFirst({
        where: {
          slug,
          languageCode,
        },
      });

      if (articleContent) {
        // 找到了对应语言的内容，查询 ArticleBase
        articleBase = await prisma.articleBase.findUnique({
          where: { id: articleContent.articleBaseId },
        });
      } else {
        // 如果通过 slug + languageCode 找不到，尝试通过 slug 找到任意语言的内容
        const anyLanguageContent = await prisma.articleContent.findFirst({
          where: { slug },
          orderBy: { createdAt: "asc" },
        });

        if (anyLanguageContent) {
          // 先尝试通过 articleBaseId 查找目标语言的内容
          articleContent = await prisma.articleContent.findFirst({
            where: {
              articleBaseId: anyLanguageContent.articleBaseId,
              languageCode,
            },
          });

          // 如果目标语言版本不存在，则使用任意存在的语言版本
          if (!articleContent) {
            articleContent = await prisma.articleContent.findFirst({
              where: {
                articleBaseId: anyLanguageContent.articleBaseId,
              },
              orderBy: { createdAt: "asc" },
            });
          }

          if (articleContent) {
            articleBase = await prisma.articleBase.findUnique({
              where: { id: articleContent.articleBaseId },
            });
          }
        }
      }
    } else {
      // 如果没有指定语言，按原来的逻辑查询
      articleContent = await prisma.articleContent.findFirst({
        where: { slug },
        orderBy: { createdAt: "asc" },
      });

      if (articleContent) {
        articleBase = await prisma.articleBase.findUnique({
          where: { id: articleContent.articleBaseId },
        });
      }
    }

    // 如果仍然找不到任何版本，返回错误
    if (!articleContent || !articleBase) {
      return error("文章不存在", null);
    }

    if (!articleBase || !articleBase.isPublished) {
      return error("文章不存在或未发布", null);
    }

    // 查询该文章所有语言版本（用于前端在缺失当前语言时提供跳转按钮）
    const allLanguageContents = await prisma.articleContent.findMany({
      where: { articleBaseId: articleContent.articleBaseId },
      select: {
        languageCode: true,
        slug: true,
        title: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 查询作者信息
    const author = await prisma.user.findUnique({
      where: { id: articleBase.authorId },
      select: {
        id: true,
        name: true,
        avatar: true,
        username: true,
      },
    });

    // 查询创作者信息（如果存在）
    const creator = await prisma.creator.findUnique({
      where: { userId: articleBase.authorId },
      select: {
        key: true,
        penName: true,
        avatar: true,
      },
    });

    // 注意：浏览量统计已移至专门的 API 端点 /api/articles/[slug]/view
    // 这里不再增加浏览量，避免 SSR + 客户端双重计数

    // 解析tags
    const tagSlugs = articleBase.tags
      ? (JSON.parse(articleBase.tags) as string[])
      : [];

    // 收藏数量（按 ArticleBase 统计）
    const bookmarkCount = await prisma.articleBookmark.count({
      where: {
        articleBaseId: articleBase.id,
      },
    });

    // 合并数据
    const article = {
      id: articleBase.id,
      contentId: articleContent.id,
      slug: articleContent.slug,
      title: articleContent.title,
      content: articleContent.content,
      excerpt: articleContent.excerpt,
      featuredImage: articleBase.featuredImage,
      publishedAt: articleBase.publishedAt,
      createdAt: articleBase.createdAt,
      updatedAt: articleBase.updatedAt,
      viewCount: articleBase.viewCount,
      bookmarkCount,
      seoTitle: articleContent.seoTitle,
      seoDescription: articleContent.seoDescription,
      seoKeyword: articleContent.seoKeyword,
      languageCode: articleContent.languageCode,
      categorySlug: articleBase.categorySlug,
      tagSlugs,
      authorId: articleBase.authorId,
      availableTranslations: allLanguageContents,
      author: creator
        ? {
            name: creator.penName || author.name,
            avatar: creator.avatar || author.avatar,
            creatorKey: creator.key || "",
          }
        : null,
    };

    return success(article);
  } catch (err: any) {
    return error(err.message || "获取文章失败");
  }
});
