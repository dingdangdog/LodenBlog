import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    await requireCreator(event);
    const query = getQuery(event);
    const languageCode = (query.languageCode as string) || "";

    const where: any = {
      isActive: true,
    };

    if (languageCode) {
      where.languageCode = languageCode;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        languageCode: true,
      },
    });

    return success({ items: categories });
  } catch (err: any) {
    return error(err.message || "获取分类列表失败");
  }
});
