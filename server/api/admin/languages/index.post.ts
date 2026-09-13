import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { code, name, nativeName, flag, isActive, isDefault, sortOrder } = body;

    if (!code || !name || !nativeName) {
      return error("语言代码、名称和原生名称不能为空");
    }

    const existing = await prisma.language.findUnique({
      where: { code },
    });

    if (existing) {
      return error("该语言代码已存在");
    }

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
        flag: flag || null,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        sortOrder: sortOrder || 0,
      },
    });

    return success({ language }, "创建成功");
  } catch (err: any) {
    return error(err.message || "创建语言失败");
  }
});

