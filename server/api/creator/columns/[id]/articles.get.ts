import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { DomainError, requireOwnColumn } from "~~/server/utils/column-domain";
import {
  buildAllKeywordsMatchWhere,
  splitSearchKeywords,
} from "~~/utils/search-keywords";

function pickLocalized<T extends { languageCode: string }>(
  rows: T[],
  languageCode: string
) {
  return (
    rows.find((row) => row.languageCode === languageCode) ||
    rows.find((row) => row.languageCode === "zh") ||
    rows[0] ||
    null
  );
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("专栏 ID 不能为空");
    await requireOwnColumn(user.id, id);

    const query = getQuery(event);
    const languageCode = String(query.languageCode || "zh");
    const keywords = splitSearchKeywords(String(query.q || ""));

    const members = await prisma.articleBase.findMany({
      where: { authorId: user.id, columnId: id },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        featuredImage: true,
        isPublished: true,
        accessType: true,
        columnId: true,
        updatedAt: true,
      },
    });

    let candidateBases: typeof members = [];
    if (keywords.length > 0) {
      const contentWhere = buildAllKeywordsMatchWhere(keywords, ["title", "slug"]);
      const matched = contentWhere
        ? await prisma.articleContent.findMany({
            where: contentWhere,
            select: { articleBaseId: true },
            take: 100,
          })
        : [];
      const ids = [...new Set(matched.map((item) => item.articleBaseId))];
      candidateBases = ids.length
        ? await prisma.articleBase.findMany({
            where: {
              id: { in: ids },
              authorId: user.id,
              OR: [{ columnId: null }, { columnId: { not: id } }],
            },
            orderBy: { updatedAt: "desc" },
            take: 20,
            select: {
              id: true,
              featuredImage: true,
              isPublished: true,
              accessType: true,
              columnId: true,
              updatedAt: true,
            },
          })
        : [];
    } else {
      candidateBases = await prisma.articleBase.findMany({
        where: {
          authorId: user.id,
          OR: [{ columnId: null }, { columnId: { not: id } }],
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          featuredImage: true,
          isPublished: true,
          accessType: true,
          columnId: true,
          updatedAt: true,
        },
      });
    }

    const bases = [...members, ...candidateBases];
    const baseIds = bases.map((item) => item.id);
    const otherColumnIds = [
      ...new Set(
        candidateBases
          .map((item) => item.columnId)
          .filter((item): item is string => !!item && item !== id)
      ),
    ];
    const [contents, columnContents] = await Promise.all([
      baseIds.length
        ? prisma.articleContent.findMany({
            where: { articleBaseId: { in: baseIds } },
            select: { articleBaseId: true, languageCode: true, slug: true, title: true },
          })
        : Promise.resolve([]),
      otherColumnIds.length
        ? prisma.columnContent.findMany({
            where: { columnId: { in: otherColumnIds } },
            select: { columnId: true, languageCode: true, title: true },
          })
        : Promise.resolve([]),
    ]);

    const present = (base: (typeof bases)[number]) => {
      const localized = pickLocalized(
        contents.filter((item) => item.articleBaseId === base.id),
        languageCode
      );
      const columnTitle =
        base.columnId && base.columnId !== id
          ? pickLocalized(
              columnContents.filter((item) => item.columnId === base.columnId),
              languageCode
            )?.title || ""
          : "";
      return {
        id: base.id,
        title: localized?.title || "",
        slug: localized?.slug || "",
        featuredImage: base.featuredImage,
        isPublished: base.isPublished,
        accessType: base.accessType,
        columnId: base.columnId,
        columnTitle,
      };
    };

    return success({
      articles: members.map(present).filter((item) => item.title || item.slug),
      candidates: candidateBases.map(present).filter((item) => item.title || item.slug),
    });
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "获取专栏文章失败");
  }
});
