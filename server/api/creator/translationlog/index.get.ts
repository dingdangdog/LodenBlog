import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const query = getQuery(event);
    const page = Math.max(parseInt((query.page as string) || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt((query.pageSize as string) || "10", 10), 1),
      50
    );

    // 构建查询条件
    const where: any = {};

    // 权限控制：非管理员只能查看自己的任务
    if (user.role < ROLE_LEVEL.ADMIN) {
      where.userId = user.id;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    // 任务类型筛选
    if (query.taskType) {
      where.taskType = query.taskType;
    }

    // 状态筛选
    if (query.status) {
      where.status = query.status;
    }

    // 文章ID筛选
    if (query.articleBaseId) {
      where.articleBaseId = query.articleBaseId;
    }

    // 源语言筛选
    if (query.sourceLanguageCode) {
      where.sourceLanguageCode = query.sourceLanguageCode;
    }

    // 目标语言筛选
    if (query.targetLanguageCode) {
      where.targetLanguageCode = query.targetLanguageCode;
    }

    // 查询翻译日志
    const [logs, total] = await Promise.all([
      prisma.translationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          // 关联文章基础信息（通过 articleBaseId）
          // 注意：Prisma 不支持直接关联，需要手动查询
        },
      }),
      prisma.translationLog.count({ where }),
    ]);

    const [aiProviders, translationProviders] = await Promise.all([
      prisma.aiConfig.findMany({
        select: {
          id: true,
          name: true,
          provider: true,
        },
      }),
      prisma.translationConfig.findMany({
        select: {
          id: true,
          name: true,
          provider: true,
        },
      }),
    ]);

    const providerMap = new Map(
      [...aiProviders, ...translationProviders].map((p) => [p.id, p])
    );

    // 组装返回数据
    const items = logs.map((log) => {
      const provider = log.providerId ? providerMap.get(log.providerId) : null;
      // console.log("provider", provider);
      return {
        ...log,
        // 创建provider对象的副本，避免序列化时被误判为循环引用
        provider: provider ? { ...provider } : null,
      };
    });
    // console.log("items", items);
    return success({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return error(err.message || "获取翻译日志失败");
  }
});
