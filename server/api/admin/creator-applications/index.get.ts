import { success, error } from "~~/server/utils/result";
import { requireAdmin } from "~~/server/utils/permission";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const query = getQuery(event);
    const status = query.status as string | undefined;
    const search = query.search as string | undefined;

    const where: Record<string, unknown> = {};

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { penName: { contains: term, mode: "insensitive" } },
        { key: { contains: term, mode: "insensitive" } },
        { message: { contains: term, mode: "insensitive" } },
      ];
    }

    const applications = await prisma.creatorApplication.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const userIds = [
      ...new Set([
        ...applications.map((a) => a.userId),
        ...applications.map((a) => a.reviewedBy).filter(Boolean),
      ]),
    ] as string[];

    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, name: true, email: true },
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const list = applications.map((a) => ({
      id: a.id,
      userId: a.userId,
      penName: a.penName,
      key: a.key,
      message: a.message,
      status: a.status,
      reviewedAt: a.reviewedAt,
      reviewedBy: a.reviewedBy,
      rejectReason: a.rejectReason,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      user: userMap.get(a.userId) ?? null,
      reviewer: a.reviewedBy ? userMap.get(a.reviewedBy) ?? null : null,
    }));

    return success(list, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取列表失败");
  }
});
