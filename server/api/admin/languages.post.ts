import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { code, name, nativeName, flag, isActive = true, isDefault = false, sortOrder = 0 } = body;

    if (!code || !name || !nativeName) {
      return error("code、name 和 nativeName 不能为空");
    }

    // 检查语言代码是否已存在
    const existing = await prisma.language.findUnique({
      where: { code },
    });

    if (existing) {
      return error("该语言代码已存在");
    }

    // 如果设为默认语言，取消其他语言的默认状态
    if (isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const language = await prisma.language.create({
      data: {
        code,
        name,
        nativeName,
        flag,
        isActive,
        isDefault,
        sortOrder,
      },
    });

    return success({ language }, "创建成功");
  } catch (err: any) {
    return error(err.message || "创建语言失败");
  }
});
