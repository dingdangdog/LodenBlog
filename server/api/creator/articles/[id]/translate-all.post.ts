import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { checkTranslationAvailability } from "~~/server/utils/translater";
import { translationQueueExecutor } from "~~/server/utils/translation-queue";

/**
 * 翻译文章到所有其他语言
 * POST /api/creator/articles/[id]/translate-all
 */
export default defineEventHandler(async (event) => {
  try {
    // 需要创作者权限
    const user = await requireCreator(event);
    const articleBaseId = getRouterParam(event, "id");

    if (!articleBaseId) {
      return error("文章 ID 不能为空");
    }

    // 检查文章是否存在
    const articleBase = await prisma.articleBase.findUnique({
      where: { id: articleBaseId },
    });

    if (!articleBase) {
      return error("文章不存在");
    }

    // 检查是否是作者或管理员
    if (articleBase.authorId !== user.id && user.role < 2) {
      return error("无权限操作此文章");
    }

    const body = await readBody(event);
    const { sourceLanguageCode, providerId, targetLanguageCodes } = body;

    if (!sourceLanguageCode) {
      return error("源语言代码不能为空");
    }

    // 验证目标语言代码（如果提供）
    let validTargetCodes: string[] | undefined;
    if (targetLanguageCodes && Array.isArray(targetLanguageCodes)) {
      if (targetLanguageCodes.length === 0) {
        return error("请至少选择一个目标语言");
      }
      // 过滤掉空值和源语言
      validTargetCodes = targetLanguageCodes.filter(
        (code: string) => code && code !== sourceLanguageCode
      );
      if (validTargetCodes.length === 0) {
        return error("目标语言不能包含源语言，请至少选择一个不同的目标语言");
      }
    }

    // 检查源语言版本是否存在
    const sourceContent = await prisma.articleContent.findFirst({
      where: {
        articleBaseId,
        languageCode: sourceLanguageCode,
      },
    });

    if (!sourceContent) {
      return error(
        `未找到文章 ${articleBaseId} 的 ${sourceLanguageCode} 语言版本`
      );
    }

    // 检查翻译可用性（系统设置和服务商配置）
    const availability = await checkTranslationAvailability();
    if (!availability.available) {
      return error(availability.reason || "翻译功能不可用");
    }

    // 确定目标语言列表
    let finalTargetCodes: string[];
    if (validTargetCodes && validTargetCodes.length > 0) {
      finalTargetCodes = validTargetCodes;
    } else {
      // 如果没有指定目标语言，翻译到所有其他语言
      const allLanguages = await prisma.language.findMany({
        where: {
          isActive: true,
          code: { not: sourceLanguageCode },
        },
      });
      finalTargetCodes = allLanguages.map((lang: any) => lang.code);
    }

    if (finalTargetCodes.length === 0) {
      return error("没有可用的目标语言");
    }

    // 为每个目标语言创建独立的任务
    const createdTasks = [];
    for (const targetCode of finalTargetCodes) {
      // 检查是否已有正在进行的相同任务（待处理或处理中）
      const existingTask = await prisma.translationLog.findFirst({
        where: {
          taskType: "TASK",
          articleBaseId,
          sourceLanguageCode,
          targetLanguageCode: targetCode,
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
      });

      if (existingTask) {
        // 跳过已存在的任务
        continue;
      }

      // 创建翻译任务记录
      const task = await prisma.translationLog.create({
        data: {
          taskType: "TASK",
          articleBaseId,
          userId: articleBase.authorId,
          sourceContentId: sourceContent.id,
          sourceLanguageCode,
          targetLanguageCode: targetCode,
          providerId: providerId || null,
          status: "PENDING",
        },
      });

      createdTasks.push(task);
      console.log(
        `[翻译任务] 创建任务记录: ${task.id}，文章ID: ${articleBaseId}，目标语言: ${targetCode}`
      );
    }

    if (createdTasks.length === 0) {
      return error("所有目标语言的翻译任务已存在，请勿重复提交");
    }

    // 检查是否有任务在运行，如果没有则启动执行器
    if (!translationQueueExecutor.isTaskRunning()) {
      translationQueueExecutor.start().catch((err) => {
        console.error("[翻译任务] 启动执行器失败:", err);
      });
    }

    return success(
      {
        message: `已创建 ${createdTasks.length} 个翻译任务，已加入队列等待执行`,
        taskIds: createdTasks.map((t) => t.id),
        articleBaseId,
        sourceLanguageCode,
        targetLanguageCodes: finalTargetCodes,
      },
      "翻译任务已创建"
    );
  } catch (err: any) {
    return error(err.message || "创建翻译任务失败");
  }
});
