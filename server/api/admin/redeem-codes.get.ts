import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const kind = String(getQuery(event).kind || "column");
    if (kind === "article") {
      const codes = await prisma.articleRedeemCode.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      return success({ kind, codes });
    }
    const codes = await prisma.columnRedeemCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return success({ kind: "column", codes });
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : "获取兑换码失败");
  }
});
