import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import {
  DomainError,
  normalizeArticleAccess,
  requireOwnColumn,
} from "~~/server/utils/column-domain";
import { isRemovedStatus, REMOVED_STATUS } from "~~/utils/column-access";

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
      select: { id: true, authorId: true, accessType: true, columnId: true, status: true },
    });
    if (!article || isRemovedStatus(article.status) || article.authorId !== user.id) {
      return error("文章不存在");
    }
    if (article.columnId === id && article.accessType !== "PAID") {
      return success({ articleId });
    }

    const access = await normalizeArticleAccess(
      user.id,
      article.accessType === "FREE" ? "FREE" : "COLUMN",
      id
    );
    const maxOrder = await prisma.articleBase.aggregate({
      where: {
        authorId: user.id,
        columnId: id,
        status: { not: REMOVED_STATUS },
      },
      _max: { columnOrder: true },
    });
    await prisma.articleBase.update({
      where: { id: articleId },
      data: {
        accessType: access.accessType,
        columnId: access.columnId,
        columnOrder: (maxOrder._max.columnOrder ?? -1) + 1,
      },
    });
    return success({ articleId }, "已加入专栏");
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "加入专栏失败");
  }
});
