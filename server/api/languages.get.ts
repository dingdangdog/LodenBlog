import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

/**
 * 公开接口：返回已启用的语言列表（用于前台/后台语言切换器）
 */
export default defineEventHandler(async (event) => {
  try {
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        code: true,
        name: true,
        nativeName: true,
        sortOrder: true,
      },
    });

    const items = languages
      .filter((l) => l?.code != null && String(l.code).trim() !== "")
      .map((l) => ({
        code: String(l.code),
        name: l.name ?? "",
        nativeName: l.nativeName ?? "",
      }));
    return success(items, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取语言列表失败");
  }
});
