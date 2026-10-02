import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { DomainError, requireOwnColumn } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    const articleId = getRouterParam(event, "articleId");
    if (!id || !articleId) return error("参数不能为空");
    await requireOwnColumn(user.id, id);

    const article = await prisma.articleBase.findUnique({
      where: { id: articleId },
      select: { id: true, authorId: true, columnId: true },
    });
    if (!article || article.authorId !== user.id || article.columnId !== id) {
      return error("这篇文章不在该专栏");
    }

    await prisma.articleBase.update({
      where: { id: articleId },
      data: { accessType: "FREE", columnId: null },
    });
    return success({ articleId }, "已移出专栏");
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "移出专栏失败");
  }
});
