import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { DomainError, requireOwnColumn } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("专栏 ID 不能为空");
    const column = await requireOwnColumn(user.id, id);
    const languageCode = String(getQuery(event).languageCode || "");
    const contents = await prisma.columnContent.findMany({
      where: { columnId: id },
      orderBy: { createdAt: "asc" },
    });
    const content = languageCode
      ? contents.find((item) => item.languageCode === languageCode) || null
      : contents[0] || null;
    return success({
      column: {
        id: column.id,
        authorId: column.authorId,
        featuredImage: column.featuredImage,
        status: column.status,
        isPublished: column.isPublished,
        updatedAt: column.updatedAt,
      },
      content,
      languages: contents.map((item) => item.languageCode),
    });
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "获取专栏失败");
  }
});
