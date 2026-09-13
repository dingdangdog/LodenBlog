import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";

/**
 * 导入系统数据
 * 直接插入数据，不做任何查找和更新
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const body = await readBody(event);
    const { jsonData } = body;
    const requestedTables: string[] | undefined = Array.isArray(body?.tables)
      ? body.tables
      : undefined;

    if (!jsonData) {
      return error("JSON 数据不能为空");
    }

    // 解析JSON数据
    let data: any;
    try {
      data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
    } catch (err: any) {
      return error("JSON 格式错误: " + err.message);
    }

    // 验证数据格式
    if (!data.data || typeof data.data !== "object") {
      return error("数据格式错误：缺少 data 字段");
    }

    const toDate = (v: any) => {
      if (!v) return v;
      if (v instanceof Date) return v;
      if (typeof v === "string") return new Date(v);
      return v;
    };

    const normalizeDates = (obj: any, dateFields: string[]) => {
      if (!obj || typeof obj !== "object") return obj;
      for (const f of dateFields) {
        if (f in obj) obj[f] = toDate(obj[f]);
      }
      return obj;
    };

    const importOrder = [
      // 系统与账号
      "users",
      "languages",
      "settings",
      "systemConfigs",

      // 内容基础配置
      "categories",
      "tags",
      "themes",

      // 翻译与创作
      "translationConfigs",
      "aiConfigs",
      "creators",

      // 文章与关联
      "articleBases",
      "articleContents",
      "comments",
      "media",
      "articleLikes",
      "translationLogs",

      // 日志
      "loginLogs",
      "visitLogs",
      "adminVisitLogs",
    ];

    const dateFieldsByTable: Record<string, string[]> = {
      users: ["createdAt", "updatedAt"],
      languages: ["createdAt", "updatedAt"],
      settings: ["createdAt", "updatedAt"],
      systemConfigs: ["createdAt", "updatedAt"],
      categories: ["createdAt", "updatedAt"],
      tags: ["createdAt", "updatedAt"],
      themes: ["createdAt", "updatedAt"],
      translationConfigs: ["createdAt", "updatedAt"],
      aiConfigs: ["createdAt", "updatedAt"],
      creators: ["createdAt", "updatedAt"],
      articleBases: ["createdAt", "updatedAt", "publishedAt"],
      articleContents: ["createdAt", "updatedAt"],
      comments: ["createdAt", "updatedAt"],
      media: ["createdAt", "updatedAt"],
      articleLikes: ["createdAt"],
      translationLogs: ["createdAt", "updatedAt", "resolvedAt", "startedAt", "completedAt"],
      loginLogs: ["createdAt"],
      visitLogs: ["createdAt"],
      adminVisitLogs: ["createdAt"],
    };

    const importers: Record<string, (tx: any, row: any) => Promise<void>> = {
      users: (tx, row) => tx.user.create({ data: normalizeDates(row, dateFieldsByTable.users) }),
      languages: (tx, row) => tx.language.create({ data: normalizeDates(row, dateFieldsByTable.languages) }),
      settings: (tx, row) => tx.setting.create({ data: normalizeDates(row, dateFieldsByTable.settings) }),
      systemConfigs: (tx, row) =>
        tx.systemConfig.create({ data: normalizeDates(row, dateFieldsByTable.systemConfigs) }),
      categories: (tx, row) => tx.category.create({ data: normalizeDates(row, dateFieldsByTable.categories) }),
      tags: (tx, row) => tx.tag.create({ data: normalizeDates(row, dateFieldsByTable.tags) }),
      themes: (tx, row) => tx.theme.create({ data: normalizeDates(row, dateFieldsByTable.themes) }),
      translationConfigs: (tx, row) =>
        tx.translationConfig.create({ data: normalizeDates(row, dateFieldsByTable.translationConfigs) }),
      aiConfigs: (tx, row) =>
        tx.aiConfig.create({ data: normalizeDates(row, dateFieldsByTable.aiConfigs) }),
      creators: (tx, row) => tx.creator.create({ data: normalizeDates(row, dateFieldsByTable.creators) }),
      articleBases: (tx, row) => tx.articleBase.create({ data: normalizeDates(row, dateFieldsByTable.articleBases) }),
      articleContents: (tx, row) =>
        tx.articleContent.create({ data: normalizeDates(row, dateFieldsByTable.articleContents) }),
      comments: (tx, row) => tx.comment.create({ data: normalizeDates(row, dateFieldsByTable.comments) }),
      media: (tx, row) => tx.media.create({ data: normalizeDates(row, dateFieldsByTable.media) }),
      articleLikes: (tx, row) => tx.articleLike.create({ data: normalizeDates(row, dateFieldsByTable.articleLikes) }),
      translationLogs: (tx, row) =>
        tx.translationLog.create({ data: normalizeDates(row, dateFieldsByTable.translationLogs) }),
      loginLogs: (tx, row) => tx.loginLog.create({ data: normalizeDates(row, dateFieldsByTable.loginLogs) }),
      visitLogs: (tx, row) => tx.visitLog.create({ data: normalizeDates(row, dateFieldsByTable.visitLogs) }),
      adminVisitLogs: (tx, row) =>
        tx.adminVisitLog.create({ data: normalizeDates(row, dateFieldsByTable.adminVisitLogs) }),
    };

    const allTables = importOrder.filter((t) => !!importers[t]);
    const tables = requestedTables?.length ? requestedTables : allTables;
    const invalidTables = tables.filter((t) => !importers[t]);
    if (invalidTables.length > 0) {
      return error(`不支持导入表: ${invalidTables.join(", ")}`);
    }

    const selectedInOrder = importOrder.filter((t) => tables.includes(t));

    // 统计信息
    const stats: Record<string, { created: number; skipped: number }> = Object.fromEntries(
      selectedInOrder.map((t) => [t, { created: 0, skipped: 0 }])
    );

    // 使用事务处理所有数据
    // 注意：Prisma 交互式事务默认 timeout=5000ms，导入全库数据很容易超时
    await prisma.$transaction(
      async (tx: any) => {
      for (const table of selectedInOrder) {
        const rows = Array.isArray(data?.data?.[table]) ? data.data[table] : [];
        for (const row of rows) {
          try {
            await importers[table]!(tx, row);
            stats[table]!.created++;
          } catch (err: any) {
            stats[table]!.skipped++;
          }
        }
      }
      },
      {
        // 允许等待连接更久一些，避免导入时排队导致失败
        maxWait: 60_000,
        // 给大批量导入足够时间（单位 ms）
        timeout: 10 * 60_000,
      }
    );

    return success(
      {
        stats,
        tables: selectedInOrder,
        message: "导入完成",
      },
      "导入成功"
    );
  } catch (err: any) {
    console.error("导入数据失败:", err);
    return error(err.message || "导入数据失败");
  }
});
