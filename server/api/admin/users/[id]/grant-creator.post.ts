import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { ROLE_LEVEL } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("用户 ID 不能为空");
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return error("用户不存在");
    }

    // 检查是否已经有 Creator 记录
    const existingCreator = await prisma.creator.findUnique({
      where: { userId: id },
    });

    if (existingCreator) {
      return error("用户已经拥有创作者记录");
    }

    // 开始事务：更新用户角色并创建 Creator 记录
    const result = await prisma.$transaction(async (tx) => {
      // 更新用户角色为 CREATOR
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          role: ROLE_LEVEL.CREATOR,
        },
      });

      // 生成 creator key：仅允许英文字母和下划线，不符合则用默认值
      let creatorKey = user.username.replace(/[^a-zA-Z_]/g, "") || `user_${id.slice(0, 8)}`;
      if (!/^[a-zA-Z_]+$/.test(creatorKey)) {
        creatorKey = `user_${id.slice(0, 8)}`;
      }

      // 确保 key 唯一（如果已存在则添加后缀）
      let finalKey = creatorKey;
      let counter = 1;
      while (await tx.creator.findUnique({ where: { key: finalKey } })) {
        finalKey = `${creatorKey}_${counter}`;
        counter++;
      }

      // 创建 Creator 记录
      const creator = await tx.creator.create({
        data: {
          userId: id,
          key: finalKey,
          penName: user.name || user.username || "",
          avatar: user.avatar || null,
        },
      });

      return {
        user: updatedUser,
        creator,
      };
    });

    return success(result, "授予创作者权限成功");
  } catch (err: any) {
    return error(err.message || "授予创作者权限失败");
  }
});
