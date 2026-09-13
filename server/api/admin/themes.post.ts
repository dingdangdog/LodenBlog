import prisma from "~~/lib/prisma";
import { success, error } from "~~/server/utils/result";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      name,
      displayName,
      mode,
      colors,
      isDefault = false,
      sortOrder = 0,
    } = body;

    // 验证必填字段
    if (!name || !displayName || !mode || !colors) {
      return error("参数错误", "缺少必填字段");
    }

    // 验证模式
    if (!["light", "dark"].includes(mode)) {
      return error("参数错误", "主题模式必须是 light 或 dark");
    }

    // 检查主题名称是否已存在
    const existing = await prisma.theme.findUnique({
      where: { name },
    });

    if (existing) {
      return error("主题已存在", "该主题名称已被使用");
    }

    // 如果设置为默认主题，取消其他同模式主题的默认状态
    if (isDefault) {
      await prisma.theme.updateMany({
        where: {
          mode,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // 创建主题
    const theme = await prisma.theme.create({
      data: {
        name,
        displayName,
        mode,
        colors: typeof colors === "string" ? colors : JSON.stringify(colors),
        isDefault,
        sortOrder,
        isActive: true,
      },
    });

    return success(theme, "主题创建成功");
  } catch (err: any) {
    console.error("创建主题失败:", err);
    return error("创建主题失败", err.message);
  }
});
