import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import {
  splitSearchKeywords,
  buildAllKeywordsMatchWhere,
} from "~~/utils/search-keywords";

const SEARCH_LIMIT = 20;

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const keyword = (query.keyword as string)?.trim();
    const keywords = splitSearchKeywords(keyword || "");

    if (!keyword || keywords.length === 0) {
      return success({
        articles: [],
      });
    }

    const select = {
      id: true,
      slug: true,
      title: true,
      languageCode: true,
    } as const;

    // 标题优先：每个关键词都必须出现在标题中
    const titleResults = await prisma.articleContent.findMany({
      where: buildAllKeywordsMatchWhere(keywords, ["title"]),
      select,
      take: SEARCH_LIMIT,
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (titleResults.length >= SEARCH_LIMIT) {
      return success({
        articles: titleResults,
      });
    }

    const titleResultIds = titleResults.map((item: { id: string }) => item.id);
    const remainingCount = SEARCH_LIMIT - titleResults.length;

    // 付费段不能参与公开搜索。免费段命中优先；公开文章再用全文补齐。
    const freeResults = await prisma.articleContent.findMany({
      where: {
        ...buildAllKeywordsMatchWhere(keywords, ["freeContent"]),
        id: { notIn: titleResultIds },
      },
      select,
      take: remainingCount,
      orderBy: { updatedAt: "desc" },
    });

    let publicBodyResults: typeof titleResults = [];
    const stillNeeded = remainingCount - freeResults.length;
    if (stillNeeded > 0) {
      const excludedIds = [
        ...titleResultIds,
        ...freeResults.map((item: { id: string }) => item.id),
      ];
      const bodyCandidates = await prisma.articleContent.findMany({
        where: {
          ...buildAllKeywordsMatchWhere(keywords, ["content"]),
          id: { notIn: excludedIds },
        },
        select: { ...select, articleBaseId: true },
        take: 100,
        orderBy: { updatedAt: "desc" },
      });
      const baseIds = [
        ...new Set(
          bodyCandidates.map(
            (item: { articleBaseId: string }) => item.articleBaseId
          )
        ),
      ];
      const freeBases =
        baseIds.length > 0
          ? await prisma.articleBase.findMany({
              where: { id: { in: baseIds }, accessType: "FREE" },
              select: { id: true },
            })
          : [];
      const freeBaseIds = new Set(
        freeBases.map((item: { id: string }) => item.id)
      );
      publicBodyResults = bodyCandidates
        .filter((item: { articleBaseId: string }) =>
          freeBaseIds.has(item.articleBaseId)
        )
        .slice(0, stillNeeded)
        .map(
          ({
            articleBaseId: _articleBaseId,
            ...item
          }: {
            articleBaseId: string;
            id: string;
            slug: string;
            title: string;
            languageCode: string;
          }) => item
        );
    }

    const articles = [...titleResults, ...freeResults, ...publicBodyResults];

    return success({
      articles,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "搜索文章失败";
    return error(errorMessage);
  }
});
