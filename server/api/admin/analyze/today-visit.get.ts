import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";
import { buildVisitMetrics } from "~~/server/utils/visit-classifier";

/**
 * 获取今日访问量
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    // 获取今天的开始和结束时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const logs = await prisma.visitLog.findMany({
      where: {
        createdAt: {
          gte: today,
          lte: todayEnd,
        },
      },
      select: {
        ipAddress: true,
        userAgent: true,
      },
    });
    const metrics = buildVisitMetrics(logs);

    return success({
      todayVisitCount: metrics.totalVisits,
      todayHumanVisitCount: metrics.humanVisits,
      todayBotVisitCount: metrics.botVisits,
      todayHumanUniqueIps: metrics.humanUniqueIps,
      todayUnknownVisitCount: metrics.unknownVisits,
      topBotVendors: metrics.botVendors.slice(0, 5),
    });
  } catch (err: any) {
    return error(err.message || "获取今日访问量失败");
  }
});

