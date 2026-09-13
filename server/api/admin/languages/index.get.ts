import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const languages = await prisma.language.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return success(languages, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取语言列表失败");
  }
});

