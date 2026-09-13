import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";

/**
 * 导出系统数据为JSON格式
 * 包括：语言、设置、分类、标签、文章、主题、翻译配置、创作者信息等
 * 说明：为满足“全表原样备份/恢复”，此接口默认导出所有表（包括 user.password、各类日志表）。
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const body = await readBody(event).catch(() => ({} as any));
    const requestedTables: string[] | undefined = Array.isArray(body?.tables)
      ? body.tables
      : undefined;

    // 构建导出数据
    const exportData: any = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      data: {},
    };

    const exporters: Record<string, () => Promise<any[]>> = {
      // 基础配置
      languages: () => prisma.language.findMany({}),
      settings: () => prisma.setting.findMany({}),
      categories: () => prisma.category.findMany({}),
      tags: () => prisma.tag.findMany({}),

      // 内容相关
      articleBases: () => prisma.articleBase.findMany({}),
      articleContents: () => prisma.articleContent.findMany({}),
      comments: () => prisma.comment.findMany({}),
      articleLikes: () => prisma.articleLike.findMany({}),

      // 资源与主题
      media: () => prisma.media.findMany({}),
      themes: () => prisma.theme.findMany({}),

      // 翻译与创作
      translationConfigs: () => prisma.translationConfig.findMany({}),
      aiConfigs: () => prisma.aiConfig.findMany({}),
      translationLogs: () => prisma.translationLog.findMany({}),
      creators: () => prisma.creator.findMany({}),

      // 系统
      systemConfigs: () => prisma.systemConfig.findMany({}),
      users: () => prisma.user.findMany({}), // 包含 password 字段（原样备份/恢复）

      // 日志
      loginLogs: () => prisma.loginLog.findMany({}),
      visitLogs: () => prisma.visitLog.findMany({}),
      adminVisitLogs: () => prisma.adminVisitLog.findMany({}),
    };

    const allTables = Object.keys(exporters);
    const tables = requestedTables?.length ? requestedTables : allTables;

    const invalidTables = tables.filter((t) => !exporters[t]);
    if (invalidTables.length > 0) {
      return error(`不支持导出表: ${invalidTables.join(", ")}`);
    }

    const results = await Promise.all(tables.map((t) => exporters[t]!()));
    for (let i = 0; i < tables.length; i++) {
      exportData.data[tables[i]] = results[i];
    }

    exportData.tables = tables;
    exportData.stats = Object.fromEntries(
      tables.map((t) => [t, Array.isArray(exportData.data[t]) ? exportData.data[t].length : 0])
    );

    return success(exportData, "导出成功");
  } catch (err: any) {
    console.error("导出数据失败:", err);
    return error(err.message || "导出数据失败");
  }
});
