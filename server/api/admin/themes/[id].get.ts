import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      return error("主题 ID 不能为空");
    }

    const theme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      return error("主题不存在");
    }

    return success(theme);
  } catch (err: any) {
    console.error("获取主题失败:", err);
    return error("获取主题失败", err.message);
  }
});

