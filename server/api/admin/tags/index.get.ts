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

    const tags = await prisma.tag.findMany({
      where,
      orderBy: [{ slug: "asc" }, { languageCode: "asc" }, { createdAt: "asc" }],
    });

    return success(tags, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取标签列表失败");
  }
});
