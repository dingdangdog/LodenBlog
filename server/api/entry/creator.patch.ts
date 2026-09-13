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

    const body = await readBody(event);
    const { key, penName, avatar, bio } = body;

    const updateData: any = {};
    if (penName !== undefined) updateData.penName = penName;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;

    // 处理 key 字段（不区分大小写唯一性检查）
    if (key !== undefined) {
      const normalizedKey = key.trim();

      if (normalizedKey) {
        // 验证格式：只允许英文字母和下划线
        if (!/^[a-zA-Z_]+$/.test(normalizedKey)) {
          return error("个人ID只能包含英文字母和下划线");
        }

        // 检查是否已被其他创作者使用（不区分大小写）
        // 先查询当前用户的创作者记录
        const currentCreator = await prisma.creator.findUnique({
          where: { userId: authUser.id },
        });

        // 如果当前用户的 key 和要设置的 key 相同（不区分大小写），则不需要检查
        const currentKeyLower = currentCreator?.key?.toLowerCase();
        const newKeyLower = normalizedKey.toLowerCase();

        if (currentKeyLower !== newKeyLower) {
          // 查询所有 key，在应用层进行不区分大小写的比较
          // 由于 key 字段在 schema 中是非空的，直接查询所有记录
          const allCreators = await prisma.creator.findMany({
            select: { key: true, userId: true },
          });

          const isKeyTaken = allCreators.some(
            (c: { key: string; userId: string }) =>
              c.userId !== authUser.id &&
              c.key &&
              c.key.toLowerCase() === newKeyLower
          );

          if (isKeyTaken) {
            return error("该个人ID已被使用");
          }
        }

        updateData.key = normalizedKey;
      } else {
        // key 不允许为空，返回错误
        return error("个人ID不能为空");
      }
    }

    // 查询或创建创作者记录
    let creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
    });

    if (!creator) {
      // 如果不存在，创建记录
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { name: true, avatar: true, username: true },
      });

      creator = await prisma.creator.create({
        data: {
          userId: authUser.id,
          penName: user?.name || user?.username || "",
          avatar: user?.avatar || null,
          ...updateData,
        },
      });
    } else {
      // 更新记录
      creator = await prisma.creator.update({
        where: { id: creator.id },
        data: updateData,
      });
    }

    return success({ creator }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新失败");
  }
});
