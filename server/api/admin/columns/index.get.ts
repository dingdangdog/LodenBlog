import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const languageCode = String(getQuery(event).languageCode || "zh");
    const columns = await prisma.column.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
    const [contents, authors] = await Promise.all([
      columns.length
        ? prisma.columnContent.findMany({
            where: { columnId: { in: columns.map((item) => item.id) } },
          })
        : Promise.resolve([]),
      columns.length
        ? prisma.user.findMany({
            where: { id: { in: [...new Set(columns.map((item) => item.authorId))] } },
            select: { id: true, username: true, name: true },
          })
        : Promise.resolve([]),
    ]);
    const authorMap = new Map(authors.map((item) => [item.id, item]));
    return success({
      columns: columns.map((column) => {
        const localized =
          contents.find(
            (item) => item.columnId === column.id && item.languageCode === languageCode
          ) || contents.find((item) => item.columnId === column.id);
        return {
          id: column.id,
          status: column.status,
          isPublished: column.isPublished,
          updatedAt: column.updatedAt,
          title: localized?.title || "",
          slug: localized?.slug || "",
          author: authorMap.get(column.authorId) || null,
        };
      }),
    });
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : "获取专栏失败");
  }
});
