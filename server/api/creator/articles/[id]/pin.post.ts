/**
 * 置顶文章：将当前文章的 pinOrder 设为表中最大值 + 1，使排序最靠前
 * POST /api/creator/articles/[id]/pin
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
      select: { id: true, authorId: true, pinOrder: true },
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

    const max = await prisma.articleBase.aggregate({
      _max: { pinOrder: true },
    });
    const nextOrder = (max._max.pinOrder ?? 0) + 1;

    await prisma.articleBase.update({
      where: { id },
      data: { pinOrder: nextOrder },
    });

    return success({ pinOrder: nextOrder }, "置顶成功");
  } catch (err: any) {
    return error(err.message || "置顶失败");
  }
});
