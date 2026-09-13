import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { getCurrentUser } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const user = await getCurrentUser(event);
    const query = getQuery(event);
    const articleBaseId = query.articleBaseId as string;

    if (!articleBaseId) {
      return error("文章 ID 不能为空");
    }

    if (!user) {
      return success({ bookmarked: false });
    }

    const bookmark = await prisma.articleBookmark.findUnique({
      where: {
        userId_articleBaseId: {
          userId: user.id,
          articleBaseId,
        },
      },
    });

    return success({ bookmarked: !!bookmark });
  } catch (err: any) {
    return error(err.message || "查询失败");
  }
});
