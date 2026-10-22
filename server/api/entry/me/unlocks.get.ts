import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireUser } from "~~/server/utils/permission";
import { isRemovedStatus } from "~~/utils/column-access";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireUser(event);
    const languageCode = String(getQuery(event).languageCode || "zh");
    const unlocks = await prisma.articleUnlock.findMany({
      where: { userId: user.id },
      orderBy: { unlockedAt: "desc" },
    });
    const articleIds = unlocks.map((item) => item.articleBaseId);
    const [bases, contents] = await Promise.all([
      articleIds.length
        ? prisma.articleBase.findMany({
            where: { id: { in: articleIds } },
            select: { id: true, accessType: true, isPublished: true, status: true },
          })
        : Promise.resolve([]),
      articleIds.length
        ? prisma.articleContent.findMany({
            where: { articleBaseId: { in: articleIds } },
            select: {
              articleBaseId: true,
              languageCode: true,
              slug: true,
              title: true,
            },
          })
        : Promise.resolve([]),
    ]);
    const baseMap = new Map(bases.map((item) => [item.id, item]));
    return success({
      unlocks: unlocks.map((item) => {
        const localized =
          contents.find(
            (content) =>
              content.articleBaseId === item.articleBaseId &&
              content.languageCode === languageCode
          ) ||
          contents.find((content) => content.articleBaseId === item.articleBaseId) ||
          null;
        const base = baseMap.get(item.articleBaseId);
        const removed = !base || isRemovedStatus(base.status);
        return {
          id: item.id,
          articleBaseId: item.articleBaseId,
          unlockedAt: item.unlockedAt,
          source: item.source,
          slug: removed ? "" : localized?.slug || "",
          title: localized?.title || "",
          readable: !removed && base?.accessType === "PAID" && base.isPublished,
        };
      }),
    });
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : "获取解锁记录失败");
  }
});
