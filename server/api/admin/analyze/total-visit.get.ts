import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";
import { buildVisitMetrics } from "~~/server/utils/visit-classifier";

/**
 * 获取全站总访问量（总访问、总人类访问、总Bot访问）
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const logs = await prisma.visitLog.findMany({
      select: {
        ipAddress: true,
        userAgent: true,
      },
    });
    const metrics = buildVisitMetrics(logs);

    return success({
      totalVisitCount: metrics.totalVisits,
      totalHumanVisitCount: metrics.humanVisits,
      totalBotVisitCount: metrics.botVisits,
    });
  } catch (err: any) {
    return error(err.message || "获取总访问量失败");
  }
});
