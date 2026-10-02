import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { DomainError, requireOwnArticle } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("文章 ID 不能为空");
    await requireOwnArticle(user.id, id);
    const codes = await prisma.articleRedeemCode.findMany({
      where: { articleBaseId: id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const userIds = [...new Set(codes.map((item) => item.usedBy).filter(Boolean))] as string[];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, name: true },
        })
      : [];
    const userMap = new Map(users.map((item) => [item.id, item]));
    return success({
      codes: codes.map((item) => ({
        ...item,
        usedByUser: item.usedBy ? userMap.get(item.usedBy) || null : null,
      })),
    });
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "获取兑换码失败");
  }
});
