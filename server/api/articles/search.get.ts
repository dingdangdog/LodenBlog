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

    // 不足时用正文补齐：每个关键词须在标题或正文中至少出现一次
    const contentResults = await prisma.articleContent.findMany({
      where: {
        ...buildAllKeywordsMatchWhere(keywords, ["title", "content"]),
        id: {
          notIn: titleResultIds,
        },
      },
      select,
      take: remainingCount,
      orderBy: {
        updatedAt: "desc",
      },
    });

    const articles = [...titleResults, ...contentResults];

    return success({
      articles,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "搜索文章失败";
    return error(errorMessage);
  }
});
