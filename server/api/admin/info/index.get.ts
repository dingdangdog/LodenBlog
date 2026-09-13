import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

/**
 * 管理端：获取所有信息页（InfoBase）及其各语言内容
 */
export default defineEventHandler(async () => {
  try {
    const bases = await prisma.infoBase.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        // 通过 Prisma 关系需要先定义 relation，当前 schema 未写 relation，用手动查询
      },
    });

    const contents = await prisma.infoContent.findMany({
      orderBy: [{ infoBaseId: "asc" }, { languageCode: "asc" }],
    });

    const contentsByBase = new Map<string, typeof contents>();
    for (const c of contents) {
      if (!contentsByBase.has(c.infoBaseId)) {
        contentsByBase.set(c.infoBaseId, []);
      }
      contentsByBase.get(c.infoBaseId)!.push(c);
    }

    const list = bases.map((base) => ({
      id: base.id,
      slug: base.slug,
      sortOrder: base.sortOrder,
      hidden: base.hidden,
      contents: (contentsByBase.get(base.id) || []).map((c) => ({
        id: c.id,
        languageCode: c.languageCode,
        title: c.title,
        content: c.content,
        updatedAt: c.updatedAt,
      })),
    }));

    return success(list, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取信息页列表失败");
  }
});
