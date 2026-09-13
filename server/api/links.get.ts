import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

/** 公开接口：获取已启用的友链列表，支持 limit（如页脚只取前 N 条） */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const limitRaw = query.limit as string | undefined;
    const limit = limitRaw ? Math.min(Math.max(1, parseInt(limitRaw, 10) || 0), 500) : undefined;

    const where = { isActive: true };

    const [list, total] = await Promise.all([
      prisma.friendLink.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        ...(limit !== undefined ? { take: limit } : {}),
      }),
      prisma.friendLink.count({ where }),
    ]);

    return success(
      {
        list,
        total,
      },
      "获取成功"
    );
  } catch (err: any) {
    return error(err.message || "获取友链列表失败");
  }
});
