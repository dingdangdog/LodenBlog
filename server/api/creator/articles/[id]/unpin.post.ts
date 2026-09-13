/**
 * 取消置顶：将文章的 pinOrder 设为 0
 * POST /api/creator/articles/[id]/unpin
 */
import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");

    if (!id) {
      return error("文章 ID 不能为空");
    }

    const articleBase = await prisma.articleBase.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!articleBase) {
      return error("文章不存在");
    }

    if (articleBase.authorId !== user.id && user.role < ROLE_LEVEL.ADMIN) {
      throw createError({
        statusCode: 403,
        message: "无权限操作此文章",
      });
    }

    await prisma.articleBase.update({
      where: { id },
      data: { pinOrder: 0 },
    });

    return success({ pinOrder: 0 }, "已取消置顶");
  } catch (err: any) {
    return error(err.message || "取消置顶失败");
  }
});
