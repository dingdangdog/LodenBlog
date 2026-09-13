import { success, error } from "~~/server/utils/result";
import { requireAdmin } from "~~/server/utils/permission";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const query = getQuery(event);
    const search = query.search as string | undefined;
    const isActive = query.isActive as string | undefined;

    const where: any = {};

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { url: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    if (isActive === "true") where.isActive = true;
    else if (isActive === "false") where.isActive = false;

    const list = await prisma.friendLink.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return success(list, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取友链列表失败");
  }
});
