import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";
import { buildVisitMetrics, classifyVisit } from "~~/server/utils/visit-classifier";

/**
 * 获取访问趋势数据
 * @query days - 天数，支持 7, 30, 100
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const query = getQuery(event);
    const days = parseInt((query.days as string) || "7", 10);
    const validDays = [7, 30, 100].includes(days) ? days : 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDays);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // 查询指定天数内的访问日志
    const logs = await prisma.visitLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        ipAddress: true,
        userAgent: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 按日期分组统计
    const dateCountMap = new Map<string, number>();
    const humanDateCountMap = new Map<string, number>();
    const botDateCountMap = new Map<string, number>();
    for (const log of logs) {
      const date = new Date(log.createdAt);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + 1);
      const classification = classifyVisit(log.userAgent);
      if (classification.category === "human") {
        humanDateCountMap.set(dateKey, (humanDateCountMap.get(dateKey) || 0) + 1);
      } else if (classification.category === "bot") {
        botDateCountMap.set(dateKey, (botDateCountMap.get(dateKey) || 0) + 1);
      }
    }

    // 生成完整的日期序列（包括没有访问的日期）
    const dates: string[] = [];
    const counts: number[] = [];
    const humanCounts: number[] = [];
    const botCounts: number[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
      dates.push(dateKey);
      counts.push(dateCountMap.get(dateKey) || 0);
      humanCounts.push(humanDateCountMap.get(dateKey) || 0);
      botCounts.push(botDateCountMap.get(dateKey) || 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const metrics = buildVisitMetrics(logs);

    return success({
      days: validDays,
      dates,
      counts,
      humanCounts,
      botCounts,
      summary: metrics,
    });
  } catch (err: any) {
    return error(err.message || "获取访问趋势数据失败");
  }
});

