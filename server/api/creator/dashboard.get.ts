import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireUser, ROLE_LEVEL } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireUser(event);
    const isAdmin = authUser.role >= ROLE_LEVEL.ADMIN;
    const isCreator = authUser.role >= ROLE_LEVEL.CREATOR;

    // 构建 ArticleBase 的 where 条件
    const articleBaseWhere = isAdmin ? {} : { authorId: authUser.id };

    // 统计文章数据（基于 ArticleBase）
    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      viewAggregate,
      lastUpdatedBase,
      languageCount,
      themeCount,
    ] = await Promise.all([
      prisma.articleBase.count({ where: articleBaseWhere }),
      prisma.articleBase.count({
        where: {
          ...articleBaseWhere,
          isPublished: true,
        },
      }),
      prisma.articleBase.count({
        where: {
          ...articleBaseWhere,
          isPublished: false,
          status: "DRAFT",
        },
      }),
      prisma.articleBase.aggregate({
        where: articleBaseWhere,
        _sum: {
          viewCount: true,
        },
      }),
      prisma.articleBase.findFirst({
        where: articleBaseWhere,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          updatedAt: true,
        },
      }),
      prisma.language.count({
        where: {
          isActive: true,
        },
      }),
      prisma.theme.count(),
    ]);

    // 获取最后更新文章的标题（从 ArticleContent 中获取）
    let lastUpdatedTitle: string | null = null;
    let lastUpdatedAt: Date | null = null;

    if (lastUpdatedBase) {
      // 获取该文章的第一个内容版本（通常使用默认语言或最早创建的版本）
      const lastUpdatedContent = await prisma.articleContent.findFirst({
        where: { articleBaseId: lastUpdatedBase.id },
        orderBy: { createdAt: "asc" }, // 获取最早创建的内容版本
        select: {
          title: true,
        },
      });

      lastUpdatedTitle = lastUpdatedContent?.title || null;
      lastUpdatedAt = lastUpdatedBase.updatedAt;
    }

    return success({
      totalArticles,
      publishedArticles,
      draftArticles,
      totalViews: viewAggregate._sum.viewCount || 0,
      lastUpdatedTitle,
      lastUpdatedAt,
      languageCount,
      themeCount,
      isCreator,
      isAdmin,
    });
  } catch (err: any) {
    return error(err.message || "获取仪表盘数据失败");
  }
});
