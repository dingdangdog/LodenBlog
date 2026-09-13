import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const search = query.search as string | undefined;
    const languageCode = query.languageCode as string | undefined;

    const where: any = {};

    // 搜索条件：匹配 name 或 slug
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    // 语言筛选
    if (languageCode) {
      where.languageCode = languageCode;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { slug: "asc" },
        { languageCode: "asc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return success(categories, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取分类列表失败");
  }
});
