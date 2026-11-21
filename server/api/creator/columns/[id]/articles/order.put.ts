import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { requireOwnColumn } from "~~/server/utils/column-domain";
import { REMOVED_STATUS } from "~~/utils/column-access";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("专栏 ID 不能为空");
    await requireOwnColumn(user.id, id);

    const body = await readBody(event);
    const articleIds = body?.articleIds;
    if (
      !Array.isArray(articleIds) ||
      articleIds.some((articleId) => typeof articleId !== "string" || !articleId.trim()) ||
      new Set(articleIds).size !== articleIds.length
    ) {
      return error("文章排序数据无效");
    }

    const saved = await prisma.$transaction(async (tx) => {
      const members = await tx.articleBase.findMany({
        where: {
          authorId: user.id,
          columnId: id,
          status: { not: REMOVED_STATUS },
        },
        select: { id: true },
      });
      const memberIds = new Set(members.map((article) => article.id));
      if (
        members.length !== articleIds.length ||
        articleIds.some((articleId: string) => !memberIds.has(articleId))
      ) {
        return false;
      }

      await Promise.all(
        articleIds.map((articleId: string, index: number) =>
          tx.articleBase.update({
            where: { id: articleId },
            data: { columnOrder: index },
          })
        )
      );
      return true;
    });

    if (!saved) return error("专栏文章列表已变化，请刷新后重试");
    return success({ articleIds }, "排序已保存");
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : "保存文章排序失败");
  }
});
