import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";
import { subscriptionView } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const query = getQuery(event);
    const status = String(query.status || "all");
    const columnId = String(query.columnId || "");
    const now = new Date();
    const where: {
      columnId?: string;
      expiresAt?: { gt: Date } | { lte: Date };
    } = {};
    if (columnId) where.columnId = columnId;
    if (status === "active") where.expiresAt = { gt: now };
    if (status === "expired") where.expiresAt = { lte: now };

    const subscriptions = await prisma.columnSubscription.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    const userIds = [...new Set(subscriptions.map((item) => item.userId))];
    const columnIds = [...new Set(subscriptions.map((item) => item.columnId))];
    const [users, contents, logs] = await Promise.all([
      userIds.length
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, name: true },
          })
        : Promise.resolve([]),
      columnIds.length
        ? prisma.columnContent.findMany({
            where: { columnId: { in: columnIds } },
            select: { columnId: true, title: true, slug: true, languageCode: true },
          })
        : Promise.resolve([]),
      prisma.columnSubscriptionLog.findMany({
        where: {
          ...(columnId ? { columnId } : {}),
          userId: { in: userIds.length ? userIds : ["__none__"] },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);
    const userMap = new Map(users.map((item) => [item.id, item]));
    return success({
      subscriptions: subscriptions.map((item) => {
        const localized = contents.find((content) => content.columnId === item.columnId);
        return {
          ...item,
          ...subscriptionView(item, now),
          user: userMap.get(item.userId) || null,
          columnTitle: localized?.title || "",
          columnSlug: localized?.slug || "",
          logs: logs.filter(
            (log) => log.userId === item.userId && log.columnId === item.columnId
          ),
        };
      }),
    });
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : "获取订阅记录失败");
  }
});
