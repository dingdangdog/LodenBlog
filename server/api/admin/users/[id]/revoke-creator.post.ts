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

    // 检查用户是否是管理员（不能撤销管理员的权限）
    if (user.role >= ROLE_LEVEL.ADMIN) {
      return error("不能撤销管理员的创作者权限");
    }

    // 检查用户是否是创作者
    if (user.role < ROLE_LEVEL.CREATOR) {
      return error("用户不是创作者，无需撤销");
    }

    // 检查是否有 Creator 记录
    const existingCreator = await prisma.creator.findUnique({
      where: { userId: id },
    });

    if (!existingCreator) {
      return error("用户没有创作者记录");
    }

    // 开始事务：更新用户角色并删除 Creator 记录
    const result = await prisma.$transaction(async (tx) => {
      // 更新用户角色为 USER
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          role: ROLE_LEVEL.USER,
        },
      });

      // 删除 Creator 记录
      await tx.creator.delete({
        where: { userId: id },
      });

      return {
        user: updatedUser,
      };
    });

    return success(result, "撤销创作者权限成功");
  } catch (err: any) {
    return error(err.message || "撤销创作者权限失败");
  }
});
