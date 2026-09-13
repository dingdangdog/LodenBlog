import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("语言 ID 不能为空");
    }

    const body = await readBody(event);
    const { code, name, nativeName, flag, isActive, isDefault, sortOrder } =
      body;

    const existing = await prisma.language.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("语言不存在");
    }

    if (code && code !== existing.code) {
      const duplicate = await prisma.language.findUnique({
        where: { code },
      });

      if (duplicate) {
        return error("该语言代码已存在");
      }
    }

    if (isDefault && !existing.isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (nativeName !== undefined) updateData.nativeName = nativeName;
    if (flag !== undefined) updateData.flag = flag;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const language = await prisma.language.update({
      where: { id },
      data: updateData,
    });

    return success({ language }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新语言失败");
  }
});
