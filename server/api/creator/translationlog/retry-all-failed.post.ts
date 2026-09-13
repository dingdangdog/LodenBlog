import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { translationQueueExecutor } from "~~/server/utils/translation-queue";

/**
 * 一键重新处理所有失败的任务
 * POST /api/creator/translationlog/retry-all-failed
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);

    // 构建查询条件
    const where: any = {
      taskType: "TASK",
      status: "FAILED",
    };

    // 权限控制：非管理员只能处理自己的任务
    if (user.role < ROLE_LEVEL.ADMIN) {
      where.userId = user.id;
    }

    // 查询所有失败的任务，按创建时间排序
    const failedTasks = await prisma.translationLog.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    if (failedTasks.length === 0) {
      return success(
        {
          totalCount: 0,
          earliestTaskId: null,
          message: "没有失败的任务需要重新处理",
        },
        "没有失败的任务需要重新处理"
      );
    }

    // 找到最早的任务
    const earliestTask = failedTasks[0];
    const otherTasks = failedTasks.slice(1);

    // 验证最早任务的源内容是否存在
    const sourceContent = await prisma.articleContent.findFirst({
      where: {
        id: earliestTask.sourceContentId,
      },
    });

    if (!sourceContent) {
      // 如果最早任务的源内容不存在，跳过它，找下一个
      let validEarliestTask = null;
      let validOtherTasks = failedTasks;

      for (const task of failedTasks) {
        const content = await prisma.articleContent.findFirst({
          where: {
            id: task.sourceContentId,
          },
        });

        if (content) {
          validEarliestTask = task;
          validOtherTasks = failedTasks.filter((t) => t.id !== task.id);
          break;
        }
      }

      if (!validEarliestTask) {
        return error("所有失败任务的源文章内容都不存在，无法重新处理");
      }

      // 更新所有有效任务的状态
      const updatePromises = validOtherTasks.map((task) =>
        prisma.translationLog.update({
          where: { id: task.id },
          data: {
            status: "PENDING",
            errorMessage: null,
            errorDetails: null,
            startedAt: null,
            completedAt: null,
            resolvedAt: null,
            retryCount: {
              increment: 1,
            },
          },
        })
      );

      // 更新最早的任务
      const updatedEarliestTask = await prisma.translationLog.update({
        where: { id: validEarliestTask.id },
        data: {
          status: "PENDING",
          errorMessage: null,
          errorDetails: null,
          startedAt: null,
          completedAt: null,
          resolvedAt: null,
          retryCount: {
            increment: 1,
          },
        },
      });

      await Promise.all(updatePromises);

      // 启动执行器（如果未运行）
      if (!translationQueueExecutor.isTaskRunning()) {
        translationQueueExecutor.start().catch((err) => {
          console.error("[翻译任务] 启动执行器失败:", err);
        });
      }

      return success(
        {
          totalCount: failedTasks.length,
          earliestTaskId: updatedEarliestTask.id,
          articleBaseId: updatedEarliestTask.articleBaseId,
          targetLanguageCode: updatedEarliestTask.targetLanguageCode,
          retryCount: updatedEarliestTask.retryCount,
          skippedCount: failedTasks.length - validOtherTasks.length - 1,
        },
        `已重新处理 ${failedTasks.length} 个失败任务，最早的任务已立即执行`
      );
    }

    // 检查最早任务是否已有正在进行的相同任务
    const existingTask = await prisma.translationLog.findFirst({
      where: {
        taskType: "TASK",
        articleBaseId: earliestTask.articleBaseId,
        sourceLanguageCode: earliestTask.sourceLanguageCode,
        targetLanguageCode: earliestTask.targetLanguageCode,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
        id: { not: earliestTask.id },
      },
    });

    if (existingTask) {
      // 如果已有相同任务在进行，跳过最早任务，处理其他任务
      const updatePromises = otherTasks.map((task) =>
        prisma.translationLog.update({
          where: { id: task.id },
          data: {
            status: "PENDING",
            errorMessage: null,
            errorDetails: null,
            startedAt: null,
            completedAt: null,
            resolvedAt: null,
            retryCount: {
              increment: 1,
            },
          },
        })
      );

      await Promise.all(updatePromises);

      // 启动执行器（如果未运行）
      if (!translationQueueExecutor.isTaskRunning()) {
        translationQueueExecutor.start().catch((err) => {
          console.error("[翻译任务] 启动执行器失败:", err);
        });
      }

      return success(
        {
          totalCount: failedTasks.length,
          earliestTaskId: null,
          skippedCount: 1,
          message: "最早的任务已有相同任务在处理中，已跳过",
        },
        `已重新处理 ${otherTasks.length} 个失败任务，最早的任务已跳过（已有相同任务在处理中）`
      );
    }

    // 更新所有其他失败任务的状态为 PENDING
    const updatePromises = otherTasks.map((task) =>
      prisma.translationLog.update({
        where: { id: task.id },
        data: {
          status: "PENDING",
          errorMessage: null,
          errorDetails: null,
          startedAt: null,
          completedAt: null,
          resolvedAt: null,
          retryCount: {
            increment: 1,
          },
        },
      })
    );

    // 更新最早的任务
    const updatedEarliestTask = await prisma.translationLog.update({
      where: { id: earliestTask.id },
      data: {
        status: "PENDING",
        errorMessage: null,
        errorDetails: null,
        startedAt: null,
        completedAt: null,
        resolvedAt: null,
        retryCount: {
          increment: 1,
        },
      },
    });

    await Promise.all(updatePromises);

    console.log(
      `[翻译任务] 一键重新处理: 共 ${failedTasks.length} 个失败任务，最早任务 ${updatedEarliestTask.id} 已立即执行，其他 ${otherTasks.length} 个任务已加入队列`
    );

    // 启动执行器（如果未运行）
    if (!translationQueueExecutor.isTaskRunning()) {
      translationQueueExecutor.start().catch((err) => {
        console.error("[翻译任务] 启动执行器失败:", err);
      });
    }

    return success(
      {
        totalCount: failedTasks.length,
        earliestTaskId: updatedEarliestTask.id,
        articleBaseId: updatedEarliestTask.articleBaseId,
        targetLanguageCode: updatedEarliestTask.targetLanguageCode,
        retryCount: updatedEarliestTask.retryCount,
        otherTasksCount: otherTasks.length,
      },
      `已重新处理 ${failedTasks.length} 个失败任务，最早的任务已立即执行`
    );
  } catch (err: any) {
    return error(err.message || "一键重新处理失败任务失败");
  }
});

