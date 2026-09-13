import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";

/**
 * AI 生成文章记录列表
 * GET /api/creator/articles/ai-generation-logs
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const query = getQuery(event);
    const page = Math.max(parseInt((query.page as string) || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt((query.pageSize as string) || "10", 10), 1),
      50
    );
    const status = (query.status as string) || "";
    const search = ((query.search as string) || "").trim();

    const where: {
      userId?: string;
      status?: string;
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        contentRequirement?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (user.role < ROLE_LEVEL.ADMIN) {
      where.userId = user.id;
    }

    if (status && ["PROCESSING", "SUCCESS", "FAILED"].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { contentRequirement: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.articleAiGenerationLog.count({ where }),
      prisma.articleAiGenerationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          userId: true,
          title: true,
          languageCode: true,
          contentRequirement: true,
          providerId: true,
          providerName: true,
          status: true,
          articleBaseId: true,
          articleContentId: true,
          generatedSlug: true,
          contentLength: true,
          errorMessage: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return success({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 0,
      },
    });
  } catch (err: any) {
    console.error("[AI生成记录] 列表查询失败:", err);
    return error(err.message || "获取AI生成记录失败");
  }
});
