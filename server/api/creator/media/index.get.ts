import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);

    const media = await prisma.media.findMany({
      where: {
        uploaderId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return success(media, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取媒体列表失败");
  }
});
