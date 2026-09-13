import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const languageCode = (query.languageCode as string) || "zh";

    // 获取所有已发布的文章
    const articleBases = await prisma.articleBase.findMany({
      where: {
        isPublished: true,
        publishedAt: { lte: new Date() },
        categorySlug: { not: null },
      },
      select: {
        categorySlug: true,
      },
    });

    // 统计每个分类的文章数量
    const counts: Record<string, number> = {};
    articleBases.forEach((base) => {
      if (base.categorySlug) {
        counts[base.categorySlug] = (counts[base.categorySlug] || 0) + 1;
      }
    });

    return success(counts);
  } catch (err: any) {
    return error(err.message || "获取分类文章数量失败");
  }
});
