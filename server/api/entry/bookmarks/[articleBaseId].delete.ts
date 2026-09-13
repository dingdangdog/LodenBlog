import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const articleBaseId = getRouterParam(event, "articleBaseId");

    if (!articleBaseId) {
      return error("文章 ID 不能为空");
    }

    await prisma.articleBookmark.deleteMany({
      where: {
        userId: user.id,
        articleBaseId,
      },
    });

    return success({ bookmarked: false }, "已取消收藏");
  } catch (err: any) {
    return error(err.message || "取消收藏失败");
  }
});
