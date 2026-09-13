import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const configs = await prisma.aiConfig.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        isActive: true,
        priority: true,
      },
      where: {
        isActive: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    return success(configs, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取AI配置列表失败");
  }
});
