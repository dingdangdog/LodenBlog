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

    // 只获取用户信息，不进行任何数据库操作
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        name: true,
        avatar: true,
        username: true,
      },
    });

    if (!user) {
      return error("用户不存在");
    }

    // 查询当前创作者记录（用于获取 key，如果已存在）
    const creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
      select: {
        key: true,
      },
    });

    // 生成建议的 key（如果当前没有 key）
    let suggestedKey = "";
    if (user.username && /^[a-zA-Z0-9_]+$/.test(user.username)) {
      // 检查 username 是否可用
      const existingCreators = await prisma.creator.findMany({
        where: {
          key: { not: null },
          NOT: { userId: authUser.id },
        },
        select: { key: true },
      });

      const usernameLower = user.username.toLowerCase();
      const isKeyTaken = existingCreators.some(
        (c: { key: string | null }) =>
          c.key && c.key.toLowerCase() === usernameLower
      );

      if (!isKeyTaken) {
        suggestedKey = user.username;
      }
    }

    // 如果 username 不可用，生成默认 key
    if (!suggestedKey) {
      suggestedKey = `user_${authUser.id.slice(0, 8)}`;
    }

    // 返回用户信息，供前端填充表单使用
    return success(
      {
        user: {
          name: user.name || user.username || "",
          avatar: user.avatar || null,
          username: user.username || "",
        },
        suggestedKey: creator?.key || suggestedKey,
      },
      "获取用户信息成功"
    );
  } catch (err: any) {
    console.error("获取用户信息失败:", err);
    return error(err.message || "获取用户信息失败");
  }
});
