import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { hashPassword } from "~~/server/utils/password";

/** 从邮箱解析账号（username）：取 @ 前部分，只保留英文、数字、下划线 */
function usernameFromEmail(email: string): string {
  const local = email.split("@")[0] || "";
  const sanitized = local.replace(/[^a-zA-Z0-9_]/g, "");
  return sanitized || "user";
}

export default defineEventHandler(async (event) => {
  try {
    return error("注册功能已关闭");
    const body = await readBody(event);
    const { email, name, password } = body;

    if (!email) {
      return error("邮箱不能为空");
    }

    if (password && password.length < 6) {
      return error("密码长度至少6位");
    }

    // 从邮箱解析账号，并保证唯一
    let username = usernameFromEmail(email);
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${usernameFromEmail(email)}${counter}`;
      counter++;
    }

    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return error("该邮箱已被注册");
    }

    // 创建用户：username 为账号（由邮箱解析），name 为昵称
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name: name || username, // 昵称默认与账号相同
        password: password ? hashPassword(password) : null,
        role: 1, // ROLE_LEVEL.USER
        isActive: true,
      },
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return success(
      {
        user: userWithoutPassword,
      },
      "注册成功"
    );
  } catch (err: any) {
    return error(err.message || "注册失败");
  }
});
