import prisma from "~~/lib/prisma";
import { success, error } from "~~/server/utils/result";

export default defineEventHandler(async () => {
  try {
    const themes = await prisma.theme.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return success(themes);
  } catch (err: any) {
    console.error("获取主题列表失败:", err);
    return error("获取主题列表失败", err.message);
  }
});
