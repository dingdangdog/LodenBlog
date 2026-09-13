import { success, error } from "~~/server/utils/result";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { createError } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");

    if (!id) {
      return error("评论 ID 不能为空");
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, articleBaseId: true },
    });

    if (!comment) {
      return error("评论不存在");
    }

    const articleBase = await prisma.articleBase.findUnique({
      where: { id: comment.articleBaseId },
      select: { authorId: true },
    });

    if (!articleBase) {
      return error("文章不存在");
    }

    if (articleBase.authorId !== user.id && user.role < ROLE_LEVEL.ADMIN) {
      throw createError({
        statusCode: 403,
        message: "无权限删除该评论",
      });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除评论失败");
  }
});
