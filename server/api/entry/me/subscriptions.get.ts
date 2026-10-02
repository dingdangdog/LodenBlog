import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireUser } from "~~/server/utils/permission";
import { subscriptionView } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireUser(event);
    const languageCode = String(getQuery(event).languageCode || "zh");
    const now = new Date();
    const subscriptions = await prisma.columnSubscription.findMany({
      where: { userId: user.id },
      orderBy: { expiresAt: "desc" },
    });
    const columnIds = subscriptions.map((item) => item.columnId);
    const [contents, logs] = await Promise.all([
      columnIds.length
        ? prisma.columnContent.findMany({ where: { columnId: { in: columnIds } } })
        : Promise.resolve([]),
      columnIds.length
        ? prisma.columnSubscriptionLog.findMany({
            where: { userId: user.id, columnId: { in: columnIds } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);
    return success({
      subscriptions: subscriptions.map((item) => {
        const localized =
          contents.find(
            (content) =>
              content.columnId === item.columnId &&
              content.languageCode === languageCode
          ) ||
          contents.find((content) => content.columnId === item.columnId) ||
          null;
        return {
          id: item.id,
          columnId: item.columnId,
          startsAt: item.startsAt,
          expiresAt: item.expiresAt,
          source: item.source,
          slug: localized?.slug || "",
          title: localized?.title || "",
          ...subscriptionView(item, now),
          logs: logs.filter((log) => log.columnId === item.columnId),
        };
      }),
    });
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : "获取订阅失败");
  }
});
