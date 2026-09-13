import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    const query = getQuery(event);
    const languageCode = (query.languageCode as string) || "";
    const listVersions = query.listVersions === "true";

    if (!id) {
      return error("文章 ID 不能为空");
    }

    // 查询 ArticleBase
    const articleBase = await prisma.articleBase.findUnique({
      where: { id },
    });

    if (!articleBase) {
      return error("文章不存在");
    }

    // 检查权限
    if (articleBase.authorId !== user.id && user.role < ROLE_LEVEL.ADMIN) {
      throw createError({
        statusCode: 403,
        message: "无权限访问该文章",
      });
    }

    // 如果只需要语言版本列表
    if (listVersions) {
      const contents = await prisma.articleContent.findMany({
        where: {
          articleBaseId: id,
        },
        select: {
          languageCode: true,
        },
      });
      const languageVersions = contents.map((c) => c.languageCode);
      return success({ languageVersions });
    }

    // 查询 ArticleContent
    // 如果提供了 languageCode，查询指定语言版本；否则查询第一个版本
    let articleContent;
    if (languageCode) {
      articleContent = await prisma.articleContent.findFirst({
        where: {
          articleBaseId: id,
          languageCode,
        },
      });
    } else {
      articleContent = await prisma.articleContent.findFirst({
        where: {
          articleBaseId: id,
        },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!articleContent) {
      return error("文章内容不存在");
    }

    // 解析tags
    const tagSlugs = articleBase.tags
      ? (JSON.parse(articleBase.tags) as string[])
      : [];

    // 合并数据
    const article = {
      id: articleBase.id,
      contentId: articleContent.id,
      slug: articleContent.slug,
      title: articleContent.title,
      content: articleContent.content,
      excerpt: articleContent.excerpt,
      featuredImage: articleBase.featuredImage,
      status: articleBase.status,
      isPublished: articleBase.isPublished,
      publishedAt: articleBase.publishedAt,
      languageCode: articleContent.languageCode,
      categorySlug: articleBase.categorySlug,
      tagSlugs,
      authorId: articleBase.authorId,
      seoTitle: articleContent.seoTitle,
      seoDescription: articleContent.seoDescription,
      seoKeyword: articleContent.seoKeyword,
      createdAt: articleBase.createdAt,
      updatedAt: articleBase.updatedAt,
    };

    return success({ article });
  } catch (err: any) {
    return error(err.message || "获取文章详情失败");
  }
});
