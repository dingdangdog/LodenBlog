import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";

/**
 * AI 生成文章记录详情
 * GET /api/creator/articles/ai-generation-logs/:id
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");

    if (!id) {
      return error("记录ID不能为空");
    }

    const log = await prisma.articleAiGenerationLog.findUnique({
      where: { id },
    });

    if (!log) {
      return error("记录不存在");
    }

    if (user.role < ROLE_LEVEL.ADMIN && log.userId !== user.id) {
      return error("无权查看该记录");
    }

    return success(log);
  } catch (err: any) {
    console.error("[AI生成记录] 详情查询失败:", err);
    return error(err.message || "获取AI生成记录详情失败");
  }
});
