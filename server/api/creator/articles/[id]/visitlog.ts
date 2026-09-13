import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { createError } from "h3";
import { buildVisitMetrics, classifyVisit } from "~~/server/utils/visit-classifier";

/**
 * 获取文章访问日志趋势数据
 * @param id - 文章 articleBaseId
 * @query days - 天数，支持 7, 30, 100
 * @query languageCode - 语言代码（可选，不传则查询所有语言版本）
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const articleBaseId = getRouterParam(event, "id");
    const query = getQuery(event);
    const days = parseInt((query.days as string) || "7", 10);
    const languageCode = (query.languageCode as string) || "";
    const trafficType = ((query.trafficType as string) || "all") as
      | "all"
      | "human"
      | "bot";

    if (!articleBaseId) {
      return error("文章 ID 不能为空");
    }

    const validDays = [7, 30, 100].includes(days) ? days : 7;

    // 查询文章基础信息，检查权限
    const articleBase = await prisma.articleBase.findUnique({
      where: { id: articleBaseId },
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

    // 查询该文章的所有语言版本（用于返回 availableLanguages）
    const allArticleContents = await prisma.articleContent.findMany({
      where: {
        articleBaseId,
      },
      select: {
        slug: true,
        languageCode: true,
      },
    });

    if (allArticleContents.length === 0) {
      return success({
        days: validDays,
        dates: [],
        counts: [],
        humanCounts: [],
        botCounts: [],
        languageCode: languageCode || "all",
        trafficType,
        summary: {
          totalVisits: 0,
          humanVisits: 0,
          humanUniqueIps: 0,
          botVisits: 0,
          unknownVisits: 0,
          botVendors: [],
        },
        availableLanguages: [],
      });
    }

    // 获取所有语言代码（始终返回该文章的所有语言版本）
    const allLanguageCodes = allArticleContents.map((c: { languageCode: string }) => c.languageCode);

    // 如果指定了语言代码，只查询该语言版本的访问日志
    const queryContents = languageCode
      ? allArticleContents.filter((c: { languageCode: string }) => c.languageCode === languageCode)
      : allArticleContents;

    if (queryContents.length === 0) {
      return success({
        days: validDays,
        dates: [],
        counts: [],
        humanCounts: [],
        botCounts: [],
        languageCode: languageCode || "all",
        trafficType,
        summary: {
          totalVisits: 0,
          humanVisits: 0,
          humanUniqueIps: 0,
          botVisits: 0,
          unknownVisits: 0,
          botVendors: [],
        },
        availableLanguages: allLanguageCodes,
      });
    }

    // 获取默认语言代码（从系统配置或数据库查询）
    const defaultLanguage = await prisma.language.findFirst({
      where: { isDefault: true },
      select: { code: true },
    });
    const defaultLangCode = defaultLanguage?.code || "zh";

    // 计算时间范围
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDays);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // 构建 URI 匹配条件
    // 如果指定了语言代码，只匹配该语言的 URI
    // 如果没有指定，匹配所有语言的 URI
    const uriConditions: any[] = [];

    if (languageCode) {
      // 指定了语言代码，只匹配该语言的 URI
      for (const content of queryContents) {
        if (content.languageCode === defaultLangCode) {
          // 默认语言的 URI 格式: /post/slug
          // 使用精确匹配，避免匹配到其他文章的 slug
          uriConditions.push({
            uri: {
              equals: `/post/${content.slug}`,
            },
          });
          // 也匹配带查询参数的格式: /post/slug?xxx
          uriConditions.push({
            uri: {
              startsWith: `/post/${content.slug}?`,
            },
          });
        } else {
          // 其他语言的 URI 格式: /{lang}/post/slug
          uriConditions.push({
            uri: {
              equals: `/${content.languageCode}/post/${content.slug}`,
            },
          });
          // 也匹配带查询参数的格式: /{lang}/post/slug?xxx
          uriConditions.push({
            uri: {
              startsWith: `/${content.languageCode}/post/${content.slug}?`,
            },
          });
        }
      }
    } else {
      // 没有指定语言代码，匹配所有语言的 URI
      for (const content of allArticleContents) {
        if (content.languageCode === defaultLangCode) {
          // 默认语言的 URI 格式: /post/slug
          uriConditions.push({
            uri: {
              equals: `/post/${content.slug}`,
            },
          });
          uriConditions.push({
            uri: {
              startsWith: `/post/${content.slug}?`,
            },
          });
        } else {
          // 其他语言的 URI 格式: /{lang}/post/slug
          uriConditions.push({
            uri: {
              equals: `/${content.languageCode}/post/${content.slug}`,
            },
          });
          uriConditions.push({
            uri: {
              startsWith: `/${content.languageCode}/post/${content.slug}?`,
            },
          });
        }
      }
    }

    // 查询访问日志
    const visitLogs = await prisma.visitLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        OR: uriConditions,
      },
      select: {
        createdAt: true,
        ipAddress: true,
        userAgent: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dateCountMap = new Map<string, number>();
    const humanDateCountMap = new Map<string, number>();
    const botDateCountMap = new Map<string, number>();
    for (const log of visitLogs) {
      const classification = classifyVisit(log.userAgent);
      const date = new Date(log.createdAt);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + 1);

      if (classification.category === "human") {
        humanDateCountMap.set(dateKey, (humanDateCountMap.get(dateKey) || 0) + 1);
      } else if (classification.category === "bot") {
        botDateCountMap.set(dateKey, (botDateCountMap.get(dateKey) || 0) + 1);
      }
    }

    const dates: string[] = [];
    const counts: number[] = [];
    const humanCounts: number[] = [];
    const botCounts: number[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
      dates.push(dateKey);
      counts.push(dateCountMap.get(dateKey) || 0);
      humanCounts.push(humanDateCountMap.get(dateKey) || 0);
      botCounts.push(botDateCountMap.get(dateKey) || 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const metrics = buildVisitMetrics(visitLogs);
    let displayCounts = counts;
    if (trafficType === "human") {
      displayCounts = humanCounts;
    } else if (trafficType === "bot") {
      displayCounts = botCounts;
    }

    return success({
      days: validDays,
      dates,
      counts: displayCounts,
      humanCounts,
      botCounts,
      languageCode: languageCode || "all",
      trafficType,
      summary: metrics,
      availableLanguages: allLanguageCodes,
    });
  } catch (err: any) {
    return error(err.message || "获取文章访问日志失败");
  }
});

