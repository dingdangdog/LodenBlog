import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth } from "~~/server/utils/permission";
import { hashPassword, verifyPassword } from "~~/server/utils/password";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireAuth(event);
    const body = await readBody(event);
    const { oldPassword, newPassword } = body;

    // 验证新密码必填
    if (!newPassword) {
      return error("请填写新密码");
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return error("新密码长度至少为6个字符");
    }

    // 获取用户信息（包含密码）
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return error("用户不存在");
    }

    // 如果用户已有密码，需要验证旧密码（修改密码场景）
    if (user.password) {
      if (!oldPassword) {
        return error("请填写旧密码");
      }

      // 验证旧密码
      if (!verifyPassword(oldPassword, user.password)) {
        return error("旧密码不正确");
      }

      // 检查新密码是否与旧密码相同
      if (verifyPassword(newPassword, user.password)) {
        return error("新密码不能与旧密码相同");
      }

      // 更新密码
      const hashedPassword = hashPassword(newPassword);
      await prisma.user.update({
        where: { id: authUser.id },
        data: {
          password: hashedPassword,
        },
      });

      return success(null, "密码修改成功");
    } else {
      // 用户没有密码，直接设置新密码（初始化密码场景）
      const hashedPassword = hashPassword(newPassword);
      await prisma.user.update({
        where: { id: authUser.id },
        data: {
          password: hashedPassword,
        },
      });

      return success(null, "密码设置成功");
    }
  } catch (err: any) {
    return error(err.message || "操作失败");
  }
});
