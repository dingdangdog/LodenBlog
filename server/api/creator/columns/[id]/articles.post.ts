import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import {
  DomainError,
  normalizeArticleAccess,
  requireOwnColumn,
} from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("专栏 ID 不能为空");
    await requireOwnColumn(user.id, id);

    const body = await readBody(event);
    const articleId = String(body?.articleId || "").trim();
    if (!articleId) return error("文章 ID 不能为空");

    const article = await prisma.articleBase.findUnique({
      where: { id: articleId },
      select: { id: true, authorId: true, accessType: true, columnId: true },
    });
    if (!article || article.authorId !== user.id) return error("文章不存在");
    if (article.columnId === id && article.accessType === "COLUMN") {
      return success({ articleId });
    }

    const access = await normalizeArticleAccess(user.id, "COLUMN", id);
    await prisma.articleBase.update({
      where: { id: articleId },
      data: { accessType: access.accessType, columnId: access.columnId },
    });
    return success({ articleId }, "已加入专栏");
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "加入专栏失败");
  }
});
