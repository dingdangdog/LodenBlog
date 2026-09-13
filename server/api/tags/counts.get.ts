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
        tags: { not: null },
      },
      select: {
        tags: true,
      },
    });

    // 统计每个标签的文章数量
    const counts: Record<string, number> = {};
    articleBases.forEach((base) => {
      if (base.tags) {
        try {
          const tagSlugs = JSON.parse(base.tags) as string[];
          tagSlugs.forEach((tagSlug) => {
            counts[tagSlug] = (counts[tagSlug] || 0) + 1;
          });
        } catch {
          // 忽略解析错误
        }
      }
    });

    return success(counts);
  } catch (err: any) {
    return error(err.message || "获取标签文章数量失败");
  }
});
