import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { translationQueueExecutor } from "~~/server/utils/translation-queue";

/**
 * 重新执行翻译任务
 * POST /api/creator/translationlog/[id]/retry
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const taskId = getRouterParam(event, "id");

    if (!taskId) {
      return error("任务 ID 不能为空");
    }

    // 查询任务
    const task = await prisma.translationLog.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return error("任务不存在");
    }

    // 权限检查：非管理员只能重试自己的任务
    if (user.role < ROLE_LEVEL.ADMIN && task.userId !== user.id) {
      return error("无权限操作此任务");
    }

    // 检查任务类型，只允许重试 TASK 类型的任务
    if (task.taskType !== "TASK") {
      return error("只能重试翻译任务，不能重试失败日志");
    }

    // 检查源内容是否存在
    const sourceContent = await prisma.articleContent.findFirst({
      where: {
        id: task.sourceContentId,
      },
    });

    if (!sourceContent) {
      return error("源文章内容不存在，无法重试");
    }

    // 检查是否已有正在进行的相同任务（排除当前任务）
    const existingTask = await prisma.translationLog.findFirst({
      where: {
        taskType: "TASK",
        articleBaseId: task.articleBaseId,
        sourceLanguageCode: task.sourceLanguageCode,
        targetLanguageCode: task.targetLanguageCode,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
        id: { not: taskId }, // 排除当前任务
      },
    });

    if (existingTask) {
      return error("该翻译任务已存在待处理或处理中的任务，请勿重复提交");
    }

    // 直接更新原任务状态，而不是创建新任务
    const updatedTask = await prisma.translationLog.update({
      where: { id: taskId },
      data: {
        status: "PENDING",
        errorMessage: null,
        errorDetails: null,
        startedAt: null,
        completedAt: null,
        resolvedAt: null,
        retryCount: {
          increment: 1, // 增加重试次数
        },
      },
    });

    console.log(
      `[翻译任务] 重新执行任务: ${updatedTask.id}，文章ID: ${task.articleBaseId}，目标语言: ${task.targetLanguageCode}，重试次数: ${updatedTask.retryCount}`
    );

    // 检查是否有任务在运行，如果没有则启动执行器
    if (!translationQueueExecutor.isTaskRunning()) {
      translationQueueExecutor.start().catch((err) => {
        console.error("[翻译任务] 启动执行器失败:", err);
      });
    }

    return success(
      {
        message: "任务已重新加入队列，等待执行",
        taskId: updatedTask.id,
        articleBaseId: task.articleBaseId,
        sourceLanguageCode: task.sourceLanguageCode,
        targetLanguageCode: task.targetLanguageCode,
        retryCount: updatedTask.retryCount,
      },
      "任务已重新加入队列"
    );
  } catch (err: any) {
    return error(err.message || "重新执行任务失败");
  }
});
