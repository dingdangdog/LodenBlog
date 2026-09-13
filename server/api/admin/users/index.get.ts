import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 获取所有创作者信息
    const creators = await prisma.creator.findMany({
      select: {
        userId: true,
        key: true,
        penName: true,
      },
    });

    // 创建 userId -> creator 的映射
    const creatorMap = new Map(creators.map((c) => [c.userId, c]));

    // 合并用户信息和创作者信息
    const usersWithCreator = users.map((user: any) => ({
      ...user,
      creator: creatorMap.get(user.id) || null,
      hasCreatorPermission: user.role >= 2, // CREATOR role level is 2
    }));

    return success(usersWithCreator, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取用户列表失败");
  }
});
