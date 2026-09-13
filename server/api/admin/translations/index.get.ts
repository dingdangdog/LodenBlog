import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const configs = await prisma.translationConfig.findMany({
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });

    return success(configs, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取翻译配置列表失败");
  }
});

