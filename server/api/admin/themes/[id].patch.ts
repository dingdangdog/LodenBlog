import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("参数错误", "缺少主题 ID");
    }

    const body = await readBody(event);
    const { name, displayName, mode, colors, isDefault, isActive, sortOrder } =
      body;

    // 检查主题是否存在
    const theme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      return error("主题不存在");
    }

    // 如果更改名称，检查新名称是否已存在
    if (name && name !== theme.name) {
      const existing = await prisma.theme.findUnique({
        where: { name },
      });

      if (existing) {
        return error("主题已存在", "该主题名称已被使用");
      }
    }

    // 验证模式
    if (mode && !["light", "dark"].includes(mode)) {
      return error("参数错误", "主题模式必须是 light 或 dark");
    }

    // 如果设置为默认主题，取消其他同模式主题的默认状态
    if (isDefault === true) {
      const themeMode = mode || theme.mode;
      await prisma.theme.updateMany({
        where: {
          mode: themeMode,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    // 构建更新数据
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (mode !== undefined) updateData.mode = mode;
    if (colors !== undefined)
      updateData.colors =
        typeof colors === "string" ? colors : JSON.stringify(colors);
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // 更新主题
    const updatedTheme = await prisma.theme.update({
      where: { id },
      data: updateData,
    });

    return success(updatedTheme, "主题更新成功");
  } catch (err: any) {
    console.error("更新主题失败:", err);
    return error("更新主题失败", err.message);
  }
});
