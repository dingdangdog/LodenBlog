import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import {
  DomainError,
  requireOwnColumn,
  subscriptionView,
} from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("专栏 ID 不能为空");
    await requireOwnColumn(user.id, id);
    const status = String(getQuery(event).status || "all");
    const now = new Date();
    const where: {
      columnId: string;
      expiresAt?: { gt: Date } | { lte: Date };
    } = { columnId: id };
    if (status === "active") where.expiresAt = { gt: now };
    if (status === "expired") where.expiresAt = { lte: now };

    const subscriptions = await prisma.columnSubscription.findMany({
      where,
      orderBy: { expiresAt: "desc" },
      take: 200,
    });
    const userIds = subscriptions.map((item) => item.userId);
    const [users, logs] = await Promise.all([
      userIds.length
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, name: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? prisma.columnSubscriptionLog.findMany({
            where: { columnId: id, userId: { in: userIds } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);
    const userMap = new Map(users.map((item) => [item.id, item]));
    return success({
      subscriptions: subscriptions.map((item) => ({
        ...item,
        ...subscriptionView(item, now),
        user: userMap.get(item.userId) || null,
        logs: logs.filter((log) => log.userId === item.userId),
      })),
    });
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "获取订阅记录失败");
  }
});
