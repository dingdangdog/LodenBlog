import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAuth(event);

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
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
        password: true, // 仅用于判断是否有密码，不会返回给前端
      },
    });

    if (!user) {
      return error("用户不存在");
    }

    // 提取密码信息，但不返回给前端
    const hasPassword = !!user.password;
    const { password, ...userWithoutPassword } = user;

    return success(
      { user: { ...userWithoutPassword, hasPassword } },
      "获取成功"
    );
  } catch (err: any) {
    return error(err.message || "获取用户信息失败");
  }
});
