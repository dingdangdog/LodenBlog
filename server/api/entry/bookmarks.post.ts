import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const body = await readBody(event);
    const articleBaseId = body?.articleBaseId as string;

    if (!articleBaseId) {
      return error("文章 ID 不能为空");
    }

    const base = await prisma.articleBase.findUnique({
      where: { id: articleBaseId },
      select: { id: true, isPublished: true },
    });

    if (!base) {
      return error("文章不存在");
    }
    if (!base.isPublished) {
      return error("只能收藏已发布的文章");
    }

    await prisma.articleBookmark.upsert({
      where: {
        userId_articleBaseId: {
          userId: user.id,
          articleBaseId,
        },
      },
      create: {
        userId: user.id,
        articleBaseId,
      },
      update: {},
    });

    return success({ bookmarked: true }, "收藏成功");
  } catch (err: any) {
    return error(err.message || "收藏失败");
  }
});
