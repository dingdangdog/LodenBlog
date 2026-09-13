import prisma from "~~/lib/prisma";
import {
  translateArticleContent,
  saveOrUpdateTranslation,
  getAvailableTranslationProviders,
} from "./translater";

/**
 * 翻译任务队列执行器（单例模式，单线程执行）
 */
class TranslationQueueExecutor {
  private isRunning = false;
  private processingTaskId: string | null = null;

  /**
   * 启动任务执行器（如果当前没有任务在运行）
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("[翻译队列] 执行器已在运行中，跳过启动");
      return;
    }

    this.isRunning = true;
    console.log("[翻译队列] 任务执行器已启动");

    // 开始处理任务
    this.processNextTask();
  }

  /**
   * 停止任务执行器
   */
  stop(): void {
    this.isRunning = false;
    this.processingTaskId = null;
    console.log("[翻译队列] 任务执行器已停止");
  }

  /**
   * 处理下一个任务
   */
  private async processNextTask(): Promise<void> {
    // 如果执行器已停止，不再处理新任务
    if (!this.isRunning) {
      return;
    }

    try {
      // 查询下一条待处理的任务（按创建时间排序）
      const task = await prisma.translationLog.findFirst({
        where: {
          taskType: "TASK",
          status: "PENDING",
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (!task) {
        // 没有待处理的任务，停止执行器
        console.log("[翻译队列] 没有待处理的任务，执行器停止");
        this.stop();
        return;
      }

      // 更新任务状态为处理中
      this.processingTaskId = task.id;
      await prisma.translationLog.update({
        where: { id: task.id },
        data: {
          status: "PROCESSING",
          startedAt: new Date(),
        },
      });

      console.log(
        `[翻译队列] 开始处理任务: ${task.id}，文章ID: ${task.articleBaseId}，目标语言: ${task.targetLanguageCode}`
      );

      // 获取源文章内容
      const sourceContent = await prisma.articleContent.findFirst({
        where: {
          articleBaseId: task.articleBaseId,
          languageCode: task.sourceLanguageCode,
        },
      });

      if (!sourceContent) {
        throw new Error(
          `未找到文章 ${task.articleBaseId} 的 ${task.sourceLanguageCode} 语言版本`
        );
      }

      // 获取可用的翻译服务商
      const providers = await getAvailableTranslationProviders(
        task.providerId || undefined
      );

      if (providers.length === 0) {
        throw new Error("没有可用的翻译服务商，请先配置翻译服务商");
      }

      // 检查是否已存在翻译
      const existingTranslation = await prisma.articleContent.findFirst({
        where: {
          articleBaseId: task.articleBaseId,
          languageCode: task.targetLanguageCode,
        },
      });

      const isUpdate = !!existingTranslation;
      console.log(
        `[翻译队列] ${isUpdate ? "更新" : "开始翻译到"} ${task.targetLanguageCode}...`
      );

      // 执行翻译任务（单个目标语言）
      const translationResult = await translateArticleContent(
        sourceContent,
        task.targetLanguageCode,
        providers
      );

      if (!translationResult.success) {
        // 翻译失败，更新任务状态
        await prisma.translationLog.update({
          where: { id: task.id },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            errorMessage: translationResult.error || "翻译失败",
            errorDetails: JSON.stringify({ translationResult }),
          },
        });

        console.log(
          `[翻译队列] 任务失败: ${task.id}，错误: ${translationResult.error}`
        );
      } else {
        // 保存或更新翻译结果
        await saveOrUpdateTranslation(
          task.articleBaseId,
          task.targetLanguageCode,
          sourceContent,
          translationResult,
          existingTranslation
        );

        // 更新任务状态为已完成
        await prisma.translationLog.update({
          where: { id: task.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        console.log(`[翻译队列] 任务完成: ${task.id}，成功`);
      }

      // 处理下一个任务
      this.processingTaskId = null;
      this.processNextTask();
    } catch (error: any) {
      console.error("[翻译队列] 处理任务时发生错误:", error);

      // 如果当前有正在处理的任务，更新其状态为失败
      if (this.processingTaskId) {
        try {
          await prisma.translationLog.update({
            where: { id: this.processingTaskId },
            data: {
              status: "FAILED",
              completedAt: new Date(),
              errorMessage: error.message || "任务执行失败",
              errorDetails: JSON.stringify({
                error: error.toString(),
                stack: error.stack,
              }),
            },
          });
        } catch (updateError) {
          console.error(
            "[翻译队列] 更新任务状态失败:",
            updateError
          );
        }
        this.processingTaskId = null;
      }

      // 继续处理下一个任务（即使当前任务失败）
      this.processNextTask();
    }
  }

  /**
   * 检查是否有任务正在运行
   */
  isTaskRunning(): boolean {
    return this.isRunning && this.processingTaskId !== null;
  }

  /**
   * 获取当前正在处理的任务ID
   */
  getProcessingTaskId(): string | null {
    return this.processingTaskId;
  }
}

// 导出单例实例
export const translationQueueExecutor = new TranslationQueueExecutor();
