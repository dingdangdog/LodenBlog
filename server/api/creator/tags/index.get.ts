import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    await requireCreator(event);
    const query = getQuery(event);
    const languageCode = (query.languageCode as string) || "";

    const where: any = {};

    if (languageCode) {
      where.languageCode = languageCode;
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        color: true,
        languageCode: true,
      },
    });

    return success({ items: tags });
  } catch (err: any) {
    return error(err.message || "获取标签列表失败");
  }
});
