import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAuth(event);
    const body = await readBody(event);
    const { avatar, bio, username, name } = body;

    const updateData: any = {};
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) {
      // 检查用户名是否已被其他用户使用
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: authUser.id },
        },
      });

      if (existingUser) {
        return error("该用户名已被使用");
      }

      updateData.username = username;
    }

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success({ user }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新失败");
  }
});
