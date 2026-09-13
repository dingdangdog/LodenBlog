import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";
import { buildVisitMetrics, classifyVisit, type VisitClientCategory } from "~~/server/utils/visit-classifier";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const query = getQuery(event);
    const page = Math.max(parseInt((query.page as string) || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt((query.pageSize as string) || "10", 10), 1),
      50
    );
    const type = (query.type as string) || "visit"; // "visit" 或 "admin"
    const days = [1, 7, 30].includes(Number(query.days)) ? Number(query.days) : 7;
    const client = ((query.client as string) || "all") as
      | "all"
      | "human"
      | "bot"
      | "unknown";
    const botVendor = ((query.botVendor as string) || "all").toLowerCase();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const listSelect = {
      id: true,
      userId: true,
      uri: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    };

    const logs =
      type === "admin"
        ? await prisma.adminVisitLog.findMany({
            where,
            select: listSelect,
            orderBy: { createdAt: "desc" },
          })
        : await prisma.visitLog.findMany({
            where,
            select: listSelect,
            orderBy: { createdAt: "desc" },
          });

    const enrichedLogs = logs.map((log) => {
      const classification = classifyVisit(log.userAgent);
      return {
        ...log,
        clientCategory: classification.category,
        clientType: classification.clientType,
        botVendor: classification.botVendor,
      };
    });

    const metrics = buildVisitMetrics(logs);
    const filteredLogs =
      client === "all"
        ? enrichedLogs
        : enrichedLogs.filter(
            (item) => item.clientCategory === (client as VisitClientCategory)
          );
    const vendorFilteredLogs =
      botVendor !== "all"
        ? filteredLogs.filter((item) => item.botVendor === botVendor)
        : filteredLogs;

    const total = vendorFilteredLogs.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = vendorFilteredLogs.slice(start, end);

    return success({
      items,
      stats: metrics,
      filters: {
        days,
        client,
        type,
        botVendor,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return error(err.message || "获取访客记录失败");
  }
});
