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

    const body = await readBody(event);
    const { isApproved, content } = body;

    const existing = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, articleBaseId: true },
    });

    if (!existing) {
      return error("评论不存在");
    }

    const articleBase = await prisma.articleBase.findUnique({
      where: { id: existing.articleBaseId },
      select: { authorId: true },
    });

    if (!articleBase) {
      return error("文章不存在");
    }

    if (articleBase.authorId !== user.id && user.role < ROLE_LEVEL.ADMIN) {
      throw createError({
        statusCode: 403,
        message: "无权限修改该评论",
      });
    }

    const updateData: any = {};
    if (typeof isApproved === "boolean") updateData.isApproved = isApproved;
    if (typeof content === "string") updateData.content = content;

    if (Object.keys(updateData).length === 0) {
      const comment = await prisma.comment.findUnique({ where: { id } });
      return success({ comment }, "无变更");
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: updateData,
    });

    return success({ comment }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新评论失败");
  }
});
