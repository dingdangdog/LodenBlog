import prisma from "~~/lib/prisma";
import { translateWithRetry } from "../translations";
import type {
  TranslationProviderConfig,
  TranslationOptions,
} from "../translations/types";
import { findUsableProviderById, isUsableProvider } from "~~/server/utils/provider-config";

/**
 * 翻译结果接口
 */
interface TranslationResult {
  success: boolean;
  translatedTitle?: string;
  translatedContent?: string;
  translatedExcerpt?: string;
  translatedSeoTitle?: string;
  translatedSeoDescription?: string;
  translatedSeoKeyword?: string;
  error?: string;
}

/**
 * 翻译服务接口
 */
interface TranslationService {
  translate(
    text: string,
    from: string,
    to: string,
    config: any
  ): Promise<string>;
}

/**
 * 翻译任务结果
 */
export interface TranslationTaskResult {
  success: boolean;
  totalTargetLanguages: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  results: Array<{
    targetLanguageCode: string;
    success: boolean;
    message?: string;
  }>;
}

/**
 * 检查翻译功能可用性
 * @returns 可用性检查结果
 */
export async function checkTranslationAvailability(): Promise<{
  available: boolean;
  reason?: string;
}> {
  // 检查系统设置是否启用自动翻译
  const setting = await prisma.setting.findFirst({
    where: {},
    orderBy: { createdAt: "asc" },
  });

  if (!setting?.autoTranslateEnabled) {
    return {
      available: false,
      reason: "系统未启用自动翻译功能，请在系统设置中开启",
    };
  }

  // 检查是否有可用的翻译服务商（使用默认场景）
  const providers = await getAvailableTranslationProviders(
    undefined,
    "general"
  );
  if (providers.length === 0) {
    return {
      available: false,
      reason: "没有可用的翻译服务商，请先配置翻译服务商",
    };
  }

  return { available: true };
}

/**
 * 翻译使用场景类型
 */
export type TranslationUsageType = "article" | "general";

/**
 * 获取可用的翻译服务商
 *
 * 根据使用场景选择默认服务商：
 * - article（文章翻译）：优先使用 primaryTranslationProvider（AiConfig），备选 fallbackTranslationProvider（TranslationConfig）
 * - general（普通翻译）：优先使用 fallbackTranslationProvider（机器翻译），备选 primaryTranslationProvider（AI）
 *
 * @param specifiedProviderId 指定的翻译服务商ID（可选），如果提供则只返回该服务商
 * @param usageType 使用场景类型（可选），默认为 "general"
 */
export async function getAvailableTranslationProviders(
  specifiedProviderId?: string,
  usageType: TranslationUsageType = "general"
) {
  // 如果指定了服务商ID，先查 AI 再查机器翻译
  if (specifiedProviderId) {
    const found = await findUsableProviderById(specifiedProviderId);
    if (!found) {
      throw new Error("指定的翻译服务商不存在、未启用或未配置API Key");
    }
    return [found.row];
  }

  // 获取系统设置
  const setting = await prisma.setting.findFirst({
    where: {},
    orderBy: { createdAt: "asc" },
  });

  const providers = [];

  const loadAiProvider = async (id?: string | null) => {
    if (!id) return null;
    const provider = await prisma.aiConfig.findUnique({ where: { id } });
    return isUsableProvider(provider) ? provider : null;
  };

  const loadMachineProvider = async (id?: string | null) => {
    if (!id) return null;
    const provider = await prisma.translationConfig.findUnique({
      where: { id },
    });
    return isUsableProvider(provider) ? provider : null;
  };

  // 根据使用场景决定优先级
  if (usageType === "article") {
    // 文章翻译：优先使用智能翻译（AiConfig），备选机器翻译
    const primaryProvider = await loadAiProvider(
      setting?.primaryTranslationProvider
    );
    if (primaryProvider) {
      providers.push(primaryProvider);
    }
    const fallbackProvider = await loadMachineProvider(
      setting?.fallbackTranslationProvider
    );
    if (fallbackProvider && !providers.find((p) => p.id === fallbackProvider.id)) {
      providers.push(fallbackProvider);
    }
  } else {
    // 普通翻译：优先使用机器翻译，备选智能翻译
    const fallbackProvider = await loadMachineProvider(
      setting?.fallbackTranslationProvider
    );
    if (fallbackProvider) {
      providers.push(fallbackProvider);
    }
    const primaryProvider = await loadAiProvider(
      setting?.primaryTranslationProvider
    );
    if (primaryProvider && !providers.find((p) => p.id === primaryProvider.id)) {
      providers.push(primaryProvider);
    }
  }

  return providers;
}

/**
 * 调用单个翻译服务
 *
 * 使用 server/translations 目录下的翻译客户端。
 * 不在这里做任何「重试」或「降级到其他服务商」的处理，出错就直接抛错，
 * 由上层决定是否以及如何重试。
 *
 * 支持的服务商示例（由 createTranslationClient 负责映射）：
 * - openai / openai-gpt35: OpenAI GPT 翻译
 * - deepl: DeepL 翻译
 * - volcano: 火山方舟翻译
 * - google: Google 翻译
 * - baidu: 百度翻译
 * - tencent: 腾讯翻译
 * - youdao: 有道翻译
 * - gemini: Google Gemini 翻译
 *
 * @param text 要翻译的文本
 * @param from 源语言代码
 * @param to 目标语言代码
 * @param provider 翻译服务商配置
 * @param options 翻译选项（可选）
 */
async function callTranslationService(
  text: string,
  from: string,
  to: string,
  provider: any,
  options?: TranslationOptions
): Promise<string> {
  // 将 provider 转换为 TranslationProviderConfig 格式
  const config: TranslationProviderConfig = {
    id: provider.id,
    name: provider.name,
    provider: provider.provider,
    apiKey: provider.apiKey,
    apiSecret: provider.apiSecret,
    apiEndpoint: provider.apiEndpoint,
    timeout: provider.timeout,
    maxRetries: provider.maxRetries,
    priority: provider.priority,
    extraConfig: provider.extraConfig,
    isActive: provider.isActive,
  };

  // 使用翻译客户端进行翻译（带重试机制）
  return await translateWithRetry(text, from, to, config, options);
}

/**
 * 翻译单个文本字段
 *
 * 只使用「首个」可用的服务商进行一次调用：
 * - 不做任何自动重试
 * - 不在多个服务商之间自动降级 / 兜底
 * - 调用失败时直接抛出原始错误，方便排查问题
 *
 * @param text 要翻译的文本
 * @param from 源语言代码
 * @param to 目标语言代码
 * @param providers 可用的翻译服务商列表（已按优先级排序，实际只取第一个）
 * @param options 翻译选项（可选，用于指定内容类型）
 * @returns 翻译后的文本
 */
async function translateText(
  text: string,
  from: string,
  to: string,
  providers: any[],
  options?: TranslationOptions
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  if (providers.length === 0) {
    throw new Error("没有可用的翻译服务商");
  }

  // 始终只使用第一个服务商，避免自动「兜底」导致错误被掩盖
  const provider = providers[0];

  try {
    const translated = await callTranslationService(
      text,
      from,
      to,
      provider,
      options
    );

    console.info(
      `[翻译] 使用 ${provider.name} (${provider.provider}) 翻译 ${from} -> ${to} 成功`
    );

    return translated;
  } catch (error: any) {
    // 只记录一次详细错误日志，然后原样抛出，方便上层拿到真实错误
    console.error(
      `[翻译] 使用 ${provider.name} (${provider.provider}) 翻译 ${from} -> ${to} 失败:`,
      error
    );
    throw error;
  }
}

/**
 * 将文本转换为 slug 格式
 * @param text 要转换的文本
 * @returns slug 格式的字符串
 */
function textToSlug(text: string): string {
  if (!text) return "";

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // 移除特殊字符
    .replace(/\s+/g, "-") // 空格替换为连字符
    .replace(/-+/g, "-") // 多个连字符合并为一个
    .replace(/^-|-$/g, ""); // 移除首尾连字符
}

/**
 * 翻译文本并生成 slug
 *
 * 该函数会先翻译文本，然后将翻译结果转换为 slug 格式
 *
 * @param text 要翻译的文本
 * @param from 源语言代码
 * @param to 目标语言代码（默认为 "en"）
 * @param specifiedProviderId 指定的翻译服务商ID（可选）
 * @returns 翻译后的 slug
 */
export async function translateToSlug(
  text: string,
  from: string,
  to: string = "en",
  specifiedProviderId?: string
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return "";
  }

  // 如果源语言和目标语言相同，直接转换为 slug
  if (from === to) {
    return textToSlug(text);
  }

  // 获取可用的翻译服务商（普通翻译场景，优先使用机器翻译）
  const providers = await getAvailableTranslationProviders(
    specifiedProviderId,
    "general"
  );

  if (providers.length === 0) {
    throw new Error("没有可用的翻译服务商，请先配置翻译服务商");
  }

  // 翻译文本
  const translatedText = await translateText(text, from, to, providers);

  // 转换为 slug
  return textToSlug(translatedText);
}

/**
 * 翻译文章内容
 */
export async function translateArticleContent(
  sourceContent: any,
  targetLanguageCode: string,
  providers: any[]
): Promise<TranslationResult> {
  try {
    const sourceLanguageCode = sourceContent.languageCode;

    console.info(
      `[翻译] 开始翻译文章内容: ${sourceLanguageCode} -> ${targetLanguageCode}，文章ID: ${sourceContent.articleBaseId}`
    );

    // 翻译各个字段（串行执行，避免频率限制）
    // 添加延迟函数，避免超过API频率限制
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    const requestDelay = 250; // 每个请求间隔250ms，确保不超过每秒5次的限制

    console.info(`[翻译] 翻译标题...`);
    const title = await translateText(
      sourceContent.title,
      sourceLanguageCode,
      targetLanguageCode,
      providers,
      { contentType: "title" } // 标题使用简化提示词
    );
    await delay(requestDelay);

    console.info(`[翻译] 翻译正文...`);
    const content = await translateText(
      sourceContent.content,
      sourceLanguageCode,
      targetLanguageCode,
      providers,
      { contentType: "content" } // 正文使用完整Markdown提示词
    );
    await delay(requestDelay);

    let excerpt: string | null = null;
    if (sourceContent.excerpt) {
      console.info(`[翻译] 翻译摘要...`);
      excerpt = await translateText(
        sourceContent.excerpt,
        sourceLanguageCode,
        targetLanguageCode,
        providers,
        { contentType: "title" } // 摘要也使用简化提示词
      );
      await delay(requestDelay);
    }

    let seoTitle: string | null = null;
    if (sourceContent.seoTitle) {
      console.info(`[翻译] 翻译SEO标题...`);
      seoTitle = await translateText(
        sourceContent.seoTitle,
        sourceLanguageCode,
        targetLanguageCode,
        providers,
        { contentType: "title" } // SEO标题使用简化提示词
      );
      await delay(requestDelay);
    }

    let seoDescription: string | null = null;
    if (sourceContent.seoDescription) {
      console.info(`[翻译] 翻译SEO描述...`);
      seoDescription = await translateText(
        sourceContent.seoDescription,
        sourceLanguageCode,
        targetLanguageCode,
        providers,
        { contentType: "title" } // SEO描述使用简化提示词
      );
      await delay(requestDelay);
    }

    let seoKeyword: string | null = null;
    if (sourceContent.seoKeyword) {
      console.info(`[翻译] 翻译SEO关键词...`);
      seoKeyword = await translateText(
        sourceContent.seoKeyword,
        sourceLanguageCode,
        targetLanguageCode,
        providers,
        { contentType: "title" } // SEO关键词使用简化提示词
      );
    }

    console.info(
      `[翻译] 文章内容翻译成功: ${sourceLanguageCode} -> ${targetLanguageCode}`
    );

    return {
      success: true,
      translatedTitle: title,
      translatedContent: content,
      translatedExcerpt: excerpt || undefined,
      translatedSeoTitle: seoTitle || undefined,
      translatedSeoDescription: seoDescription || undefined,
      translatedSeoKeyword: seoKeyword || undefined,
    };
  } catch (error: any) {
    console.error(
      `[翻译] 文章内容翻译失败: ${sourceContent.languageCode} -> ${targetLanguageCode}`
    );
    return {
      success: false,
      error: error.message || "翻译失败",
    };
  }
}

/**
 * 保存或更新翻译结果
 * @param articleBaseId 文章基础ID
 * @param targetLanguageCode 目标语言代码
 * @param sourceContent 源内容
 * @param translationResult 翻译结果
 * @param existingTranslation 已存在的翻译（可选）
 */
export async function saveOrUpdateTranslation(
  articleBaseId: string,
  targetLanguageCode: string,
  sourceContent: any,
  translationResult: TranslationResult,
  existingTranslation?: any
): Promise<void> {
  const finalSlug = sourceContent.slug;
  const isUpdate = !!existingTranslation;

  if (isUpdate) {
    await prisma.articleContent.update({
      where: { id: existingTranslation.id },
      data: {
        title: translationResult.translatedTitle!,
        content: translationResult.translatedContent!,
        excerpt: translationResult.translatedExcerpt,
        seoTitle: translationResult.translatedSeoTitle,
        seoDescription: translationResult.translatedSeoDescription,
        seoKeyword: translationResult.translatedSeoKeyword,
      },
    });
    console.info(`[翻译] 更新翻译到 ${targetLanguageCode} 成功`);
  } else {
    await prisma.articleContent.create({
      data: {
        articleBaseId,
        languageCode: targetLanguageCode,
        slug: finalSlug,
        title: translationResult.translatedTitle!,
        content: translationResult.translatedContent!,
        excerpt: translationResult.translatedExcerpt,
        seoTitle: translationResult.translatedSeoTitle,
        seoDescription: translationResult.translatedSeoDescription,
        seoKeyword: translationResult.translatedSeoKeyword,
      },
    });
    console.info(`[翻译] 翻译到 ${targetLanguageCode} 成功`);
  }
}

/**
 * 记录翻译失败日志
 */
async function logTranslationFailure(
  articleBaseId: string,
  sourceContentId: string,
  sourceLanguageCode: string,
  targetLanguageCode: string,
  providerId: string | null,
  errorMessage: string,
  errorDetails?: any
) {
  try {
    // 获取文章的作者ID（用户ID）
    const articleBase = await prisma.articleBase.findUnique({
      where: { id: articleBaseId },
      select: { authorId: true },
    });

    if (!articleBase) {
      console.error("无法记录翻译失败日志：文章不存在", articleBaseId);
      return;
    }

    // 使用新的 TranslationLog 表结构，taskType 为 FAILURE_LOG
    await prisma.translationLog.create({
      data: {
        taskType: "FAILURE_LOG",
        articleBaseId,
        userId: articleBase.authorId,
        sourceContentId,
        sourceLanguageCode,
        targetLanguageCode,
        providerId,
        errorMessage,
        errorDetails: errorDetails ? JSON.stringify(errorDetails) : null,
        status: "PENDING_RETRY",
        retryCount: 0,
      },
    });
  } catch (error) {
    console.error("记录翻译失败日志失败:", error);
  }
}

/**
 * 翻译文章到其他语言
 * @param articleBaseId 文章基础ID
 * @param sourceLanguageCode 源语言代码
 * @param specifiedProviderId 指定的翻译服务商ID（可选），如果提供则只使用该服务商
 * @param targetLanguageCodes 指定的目标语言代码列表（可选），如果提供则只翻译到这些语言，否则翻译到所有其他语言
 * @returns 翻译任务结果
 */
export async function translateArticleToOtherLanguages(
  articleBaseId: string,
  sourceLanguageCode: string,
  specifiedProviderId?: string,
  targetLanguageCodes?: string[]
): Promise<TranslationTaskResult> {
  const result: TranslationTaskResult = {
    success: true,
    totalTargetLanguages: 0,
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    results: [],
  };

  try {
    // 1. 获取源文章内容
    const sourceContent = await prisma.articleContent.findFirst({
      where: {
        articleBaseId,
        languageCode: sourceLanguageCode,
      },
    });

    if (!sourceContent) {
      throw new Error(
        `未找到文章 ${articleBaseId} 的 ${sourceLanguageCode} 语言版本`
      );
    }

    // 2. 获取目标语言（排除源语言）
    let targetLanguages;
    if (targetLanguageCodes && targetLanguageCodes.length > 0) {
      // 如果指定了目标语言列表，只翻译到这些语言
      // 过滤掉源语言和无效的语言代码
      const validTargetCodes = targetLanguageCodes.filter(
        (code) => code && code !== sourceLanguageCode
      );

      if (validTargetCodes.length === 0) {
        return result;
      }

      targetLanguages = await prisma.language.findMany({
        where: {
          isActive: true,
          code: { in: validTargetCodes },
        },
      });
    } else {
      // 如果没有指定目标语言，翻译到所有其他语言
      targetLanguages = await prisma.language.findMany({
        where: {
          isActive: true,
          code: { not: sourceLanguageCode },
        },
      });
    }

    result.totalTargetLanguages = targetLanguages.length;

    if (targetLanguages.length === 0) {
      return result;
    }

    // 3. 获取可用的翻译服务商（文章翻译场景，优先使用智能翻译）
    const providers = await getAvailableTranslationProviders(
      specifiedProviderId,
      "article"
    );

    if (providers.length === 0) {
      throw new Error("没有可用的翻译服务商，请先配置翻译服务商");
    }

    // 4. 对每个目标语言进行翻译
    console.info(
      `[翻译] 开始翻译任务: 文章 ${articleBaseId}，源语言 ${sourceLanguageCode}，目标语言数量: ${targetLanguages.length}`
    );

    for (const targetLanguage of targetLanguages) {
      const targetLanguageCode = targetLanguage.code;

      try {
        // 检查是否已存在翻译
        const existingTranslation = await prisma.articleContent.findFirst({
          where: {
            articleBaseId,
            languageCode: targetLanguageCode,
          },
        });

        const isUpdate = !!existingTranslation;
        console.info(
          `[翻译] ${isUpdate ? "更新" : "开始翻译到"} ${targetLanguageCode}...`
        );

        // 执行翻译
        const translationResult = await translateArticleContent(
          sourceContent,
          targetLanguageCode,
          providers
        );

        if (!translationResult.success) {
          // 翻译失败，记录失败日志（只记录一次，避免重复）
          const errorMsg = translationResult.error || "翻译失败";
          console.error(
            `[翻译] 翻译到 ${targetLanguageCode} 失败: ${errorMsg}`
          );
          await logTranslationFailure(
            articleBaseId,
            sourceContent.id,
            sourceLanguageCode,
            targetLanguageCode,
            providers[0]?.id || null,
            errorMsg,
            { translationResult }
          );

          result.failureCount++;
          result.results.push({
            targetLanguageCode,
            success: false,
            message: errorMsg,
          });
          continue;
        }

        // 保存或更新翻译结果
        await saveOrUpdateTranslation(
          articleBaseId,
          targetLanguageCode,
          sourceContent,
          translationResult,
          existingTranslation
        );

        result.successCount++;
        result.results.push({
          targetLanguageCode,
          success: true,
          message: isUpdate ? "更新翻译成功" : "翻译成功",
        });
      } catch (error: any) {
        // 记录失败日志
        await logTranslationFailure(
          articleBaseId,
          sourceContent.id,
          sourceLanguageCode,
          targetLanguageCode,
          providers[0]?.id || null,
          error.message || "翻译失败",
          { error: error.toString(), stack: error.stack }
        );

        result.failureCount++;
        result.results.push({
          targetLanguageCode,
          success: false,
          message: error.message || "翻译失败",
        });
      }
    }

    result.success = result.failureCount === 0;
    return result;
  } catch (error: any) {
    result.success = false;
    result.results.push({
      targetLanguageCode: "",
      success: false,
      message: error.message || "翻译任务执行失败",
    });
    return result;
  }
}

/**
 * 重试失败的翻译任务
 * @param failureLogId 失败日志ID（可选，如果不提供则重试所有待重试的任务）
 * @param userId 用户ID（可选，如果提供则只重试该用户的失败日志）
 * @param specifiedProviderId 指定的翻译服务商ID（可选），如果提供则只使用该服务商
 */
export async function retryFailedTranslation(
  failureLogId?: string,
  userId?: string,
  specifiedProviderId?: string
): Promise<TranslationTaskResult> {
  const result: TranslationTaskResult = {
    success: true,
    totalTargetLanguages: 0,
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    results: [],
  };

  try {
    // 构建查询条件
    const where: any = {
      taskType: "FAILURE_LOG",
      status: "PENDING_RETRY",
    };

    // 如果指定了用户ID，只查询该用户的失败日志
    if (userId) {
      where.userId = userId;
    }

    // 获取待重试的失败日志
    let failureLogs: any[] = [];
    if (failureLogId) {
      const log = await prisma.translationLog.findUnique({
        where: { id: failureLogId },
      });
      // 确保是失败日志类型且状态为待重试
      if (
        log &&
        log.taskType === "FAILURE_LOG" &&
        log.status === "PENDING_RETRY"
      ) {
        failureLogs = [log];
      } else {
        failureLogs = [];
      }
    } else {
      failureLogs = await prisma.translationLog.findMany({
        where,
      });
    }

    if (failureLogs.length === 0) {
      return result;
    }

    result.totalTargetLanguages = failureLogs.length;

    // 获取可用的翻译服务商（重试文章翻译，优先使用智能翻译）
    const providers = await getAvailableTranslationProviders(
      specifiedProviderId,
      "article"
    );

    if (providers.length === 0) {
      throw new Error("没有可用的翻译服务商，请先配置翻译服务商");
    }

    // 对每个失败的任务进行重试
    for (const failureLog of failureLogs) {
      if (!failureLog) continue;

      try {
        // 获取源文章内容
        const sourceContent = await prisma.articleContent.findUnique({
          where: { id: failureLog.sourceContentId },
        });

        if (!sourceContent) {
          // 源内容不存在，标记为已解决
          await prisma.translationLog.update({
            where: { id: failureLog.id },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
            },
          });

          result.skippedCount++;
          result.results.push({
            targetLanguageCode: failureLog.targetLanguageCode,
            success: false,
            message: "源文章内容不存在",
          });
          continue;
        }

        // 检查是否已存在翻译
        const existingTranslation = await prisma.articleContent.findFirst({
          where: {
            articleBaseId: failureLog.articleBaseId,
            languageCode: failureLog.targetLanguageCode,
          },
        });

        const isUpdate = !!existingTranslation;

        // 执行翻译
        const translationResult = await translateArticleContent(
          sourceContent,
          failureLog.targetLanguageCode,
          providers
        );

        if (!translationResult.success) {
          // 更新失败日志
          await prisma.translationLog.update({
            where: { id: failureLog.id },
            data: {
              retryCount: failureLog.retryCount + 1,
              errorMessage: translationResult.error || "翻译失败",
              errorDetails: JSON.stringify({ translationResult }),
            },
          });

          result.failureCount++;
          result.results.push({
            targetLanguageCode: failureLog.targetLanguageCode,
            success: false,
            message: translationResult.error || "翻译失败",
          });
          continue;
        }

        // 保存或更新翻译结果
        await saveOrUpdateTranslation(
          failureLog.articleBaseId,
          failureLog.targetLanguageCode,
          sourceContent,
          translationResult,
          existingTranslation
        );

        // 标记失败日志为已解决
        await prisma.translationLog.update({
          where: { id: failureLog.id },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
          },
        });

        result.successCount++;
        result.results.push({
          targetLanguageCode: failureLog.targetLanguageCode,
          success: true,
          message: "重试翻译成功",
        });
      } catch (error: any) {
        // 更新失败日志
        await prisma.translationLog.update({
          where: { id: failureLog.id },
          data: {
            retryCount: failureLog.retryCount + 1,
            errorMessage: error.message || "翻译失败",
            errorDetails: JSON.stringify({
              error: error.toString(),
              stack: error.stack,
            }),
          },
        });

        result.failureCount++;
        result.results.push({
          targetLanguageCode: failureLog.targetLanguageCode,
          success: false,
          message: error.message || "翻译失败",
        });
      }
    }

    result.success = result.failureCount === 0;
    return result;
  } catch (error: any) {
    result.success = false;
    result.results.push({
      targetLanguageCode: "",
      success: false,
      message: error.message || "重试翻译任务失败",
    });
    return result;
  }
}
