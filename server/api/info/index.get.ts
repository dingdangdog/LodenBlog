import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { isRetiredInfoSlug } from "~~/server/info-template";

/**
 * 公开接口：获取信息页列表（slug + 各语言标题），用于底部链接等
 */
export default defineEventHandler(async () => {
  try {
    const bases = (await prisma.infoBase.findMany({
      where: { hidden: false },
      orderBy: { sortOrder: "asc" },
    })).filter((base) => !isRetiredInfoSlug(base.slug));

    const contents = await prisma.infoContent.findMany({
      where: { infoBaseId: { in: bases.map((b) => b.id) } },
      select: { infoBaseId: true, languageCode: true, title: true },
      orderBy: [{ infoBaseId: "asc" }, { languageCode: "asc" }],
    });

    const contentsByBase = new Map<string, { languageCode: string; title: string }[]>();
    for (const c of contents) {
      if (!contentsByBase.has(c.infoBaseId)) {
        contentsByBase.set(c.infoBaseId, []);
      }
      contentsByBase.get(c.infoBaseId)!.push({ languageCode: c.languageCode, title: c.title });
    }

    const list = bases.map((base) => ({
      slug: base.slug,
      sortOrder: base.sortOrder,
      titles: (contentsByBase.get(base.id) || []).reduce(
        (acc, { languageCode, title }) => {
          acc[languageCode] = title;
          return acc;
        },
        {} as Record<string, string>
      ),
    }));

    return success(list);
  } catch (err: any) {
    return error(err.message || "获取信息页列表失败");
  }
});
