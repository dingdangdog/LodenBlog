import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth, ROLE_LEVEL } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAuth(event);

    // 检查是否是创作者
    if (authUser.role < ROLE_LEVEL.CREATOR) {
      return error("您不是创作者");
    }

    // 查询或创建创作者记录
    let creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
    });

    if (!creator) {
      // 如果不存在，创建默认记录
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { name: true, avatar: true, username: true },
      });

      creator = await prisma.creator.create({
        data: {
          userId: authUser.id,
          penName: user?.name || user?.username || "",
          avatar: user?.avatar || null,
        },
      });
    }

    return success({ creator }, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取创作者信息失败");
  }
});

