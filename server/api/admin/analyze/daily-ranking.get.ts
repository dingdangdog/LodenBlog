import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";
import { classifyVisit } from "~~/server/utils/visit-classifier";

/**
 * 获取文章访问排名
 * @query range - 时间范围: today | week | all，默认 today
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const query = getQuery(event);
    const range = (query.range as string) || "today";

    const now = new Date();
    let startDate: Date;
    let endDate: Date | undefined;

    if (range === "today") {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "week") {
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = day === 0 ? 6 : day - 1; // 周一为本周开始
      startDate.setDate(startDate.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // all: 从最早数据开始
      startDate = new Date(0);
    }

    const where: any = {
      uri: {
        contains: "/post/",
      },
    };
    if (endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // 查询访问日志
    const logs = await prisma.visitLog.findMany({
      where,
      select: {
        uri: true,
        userAgent: true,
      },
    });

    // 从URI中提取slug并按真人/Bot分类统计
    const totalMap = new Map<string, number>();
    const humanMap = new Map<string, number>();
    const botMap = new Map<string, number>();
    for (const log of logs) {
      const match = log.uri.match(/\/(?:[^\/]+\/)?post\/([^\/\?]+)/);
      if (match && match[1]) {
        const slug = match[1];
        totalMap.set(slug, (totalMap.get(slug) || 0) + 1);
        const classification = classifyVisit(log.userAgent);
        if (classification.category === "human") {
          humanMap.set(slug, (humanMap.get(slug) || 0) + 1);
        } else if (classification.category === "bot") {
          botMap.set(slug, (botMap.get(slug) || 0) + 1);
        }
      }
    }

    const LIMIT = 30;

    const ranking = Array.from(totalMap.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, LIMIT);

    const humanRanking = Array.from(humanMap.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, LIMIT);

    const botRanking = Array.from(botMap.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, LIMIT);

    const slugs = Array.from(
      new Set([
        ...ranking.map((r) => r.slug),
        ...humanRanking.map((r) => r.slug),
        ...botRanking.map((r) => r.slug),
      ])
    );
    const articleContents = await prisma.articleContent.findMany({
      where: {
        slug: {
          in: slugs,
        },
      },
      select: {
        slug: true,
        title: true,
        articleBaseId: true,
        languageCode: true,
      },
    });

    // 构建slug到文章信息的映射
    const slugToArticle = new Map();
    for (const content of articleContents) {
      if (!slugToArticle.has(content.slug)) {
        slugToArticle.set(content.slug, content);
      }
    }

    const buildResult = (list: Array<{ slug: string; count: number }>) =>
      list.map((item) => {
        const article = slugToArticle.get(item.slug);
        return {
          slug: item.slug,
          count: item.count,
          title: article?.title || item.slug,
          articleBaseId: article?.articleBaseId || null,
          languageCode: article?.languageCode || null,
        };
      });

    const result = ranking.map((item) => {
      const article = slugToArticle.get(item.slug);
      return {
        slug: item.slug,
        count: item.count,
        title: article?.title || item.slug,
        articleBaseId: article?.articleBaseId || null,
        languageCode: article?.languageCode || null,
      };
    });

    return success({
      ranking: result,
      humanRanking: buildResult(humanRanking),
      botRanking: buildResult(botRanking),
    });
  } catch (err: any) {
    return error(err.message || "获取文章排名失败");
  }
});
