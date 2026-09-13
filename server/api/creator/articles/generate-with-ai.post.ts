import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { callAIWithPrompt } from "~~/server/utils/ai-call";
import { getProviderConfigForAI } from "~~/server/ai";

/**
 * AI生成文章
 * POST /api/creator/articles/generate-with-ai
 */
export default defineEventHandler(async (event) => {
  let generationLogId: string | null = null;

  try {
    // 需要创作者权限
    const user = await requireCreator(event);

    const body = await readBody(event);
    const {
      title,
      languageCode,
      contentRequirement,
      providerId, // 可选，指定使用的AI服务商ID
    } = body;

    // 验证必填参数
    if (!title || !title.trim()) {
      return error("文章标题不能为空");
    }

    if (!languageCode || !languageCode.trim()) {
      return error("文章语言不能为空");
    }

    if (!contentRequirement || !contentRequirement.trim()) {
      return error("文章内容要求不能为空");
    }

    const trimmedTitle = title.trim();
    const trimmedLanguageCode = languageCode.trim();
    const trimmedRequirement = contentRequirement.trim();

    // 验证语言代码是否存在
    const language = await prisma.language.findUnique({
      where: { code: trimmedLanguageCode },
      select: { code: true, name: true, nativeName: true },
    });
    if (!language) {
      return error("语言不存在");
    }

    let provider = await getProviderConfigForAI(providerId || null);
    if (!provider) {
      return error("没有可用的AI服务商，请先配置AI服务");
    }

    // 先写入生成记录，便于追溯与失败排查
    const generationLog = await prisma.articleAiGenerationLog.create({
      data: {
        userId: user.id,
        title: trimmedTitle,
        languageCode: trimmedLanguageCode,
        contentRequirement: trimmedRequirement,
        providerId: providerId?.trim() || null,
        providerName: provider.name,
        status: "PROCESSING",
      },
    });
    generationLogId = generationLog.id;

    // 文章生成需要更大 token 限制，在原有 extraConfig 基础上增强
    const extra = provider.extraConfig ? JSON.parse(provider.extraConfig) : {};
    if (provider.provider === "gemini") {
      provider = {
        ...provider,
        extraConfig: JSON.stringify({
          ...extra,
          maxOutputTokens: Math.max(extra.maxOutputTokens ?? 0, 32768),
        }),
      };
    } else {
      provider = {
        ...provider,
        extraConfig: JSON.stringify({
          ...extra,
          maxTokens: Math.max(extra.maxTokens ?? 0, 16000),
        }),
      };
    }

    // 构建AI提示词
    const languageName = language.nativeName || language.name || trimmedLanguageCode;
    const systemPrompt = `你是一位专业的内容创作者。请根据用户提供的要求，创作一篇高质量的文章。

要求：
1. 文章标题：${trimmedTitle}
2. 语言：使用${languageName}（语言代码：${trimmedLanguageCode}）
3. 内容要求：${trimmedRequirement}
4. 输出格式：使用Markdown格式
5. 文章结构：包含清晰的标题层级、段落、必要的列表和强调内容
6. 内容质量：内容要充实、准确、有价值，符合读者期望

请直接输出文章的Markdown内容，不要添加任何解释性文字。`;

    // 调用AI服务生成文章
    let generatedContent: string;
    try {
      console.info(
        `[AI写文章] 开始调用AI服务 ${provider.name} (${provider.provider})，记录ID: ${generationLogId}`
      );
      generatedContent = await callAIWithPrompt(systemPrompt, provider);

      if (!generatedContent || !generatedContent.trim()) {
        throw new Error("AI返回的内容为空");
      }

      // 检查是否可能被截断（简单启发式检查）
      const trimmedContent = generatedContent.trim();
      const lastChar = trimmedContent[trimmedContent.length - 1];
      const possiblyTruncated =
        ![".", "。", "!", "！", "?", "？", "}", "]", ">"].includes(lastChar) &&
        trimmedContent.length > 500; // 长度超过500且不以标点结束

      if (possiblyTruncated) {
        console.warn(
          `[AI写文章] 警告：生成的内容可能被截断（最后字符: "${lastChar}"）。内容长度: ${trimmedContent.length}`
        );
      }
    } catch (aiError: any) {
      console.error("[AI写文章] AI调用失败:", aiError);
      const errMsg = `AI生成失败: ${aiError.message || "未知错误"}，请检查AI服务配置或稍后重试`;
      await prisma.articleAiGenerationLog.update({
        where: { id: generationLogId },
        data: {
          status: "FAILED",
          errorMessage: errMsg,
          completedAt: new Date(),
        },
      });
      return error(errMsg);
    }

    // 生成slug（使用标题的拼音或简化版本）
    // 简单实现：使用时间戳+随机数确保唯一性
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const baseSlug = `ai-article-${timestamp}-${randomStr}`;

    let descLength = 300;
    if (trimmedLanguageCode.toLowerCase().startsWith("zh")) {
      descLength = 150;
    }
    // 生成简介（取正文前200个字符）
    let excerpt = generatedContent
      .replace(/^#.*$/gm, "") // 移除标题行
      .replace(/[*_~`]/g, "") // 移除Markdown标记
      .trim()
      .substring(0, descLength);

    // 创建文章（草稿状态）
    const result = await prisma.$transaction(async (tx) => {
      // 创建 ArticleBase
      const articleBase = await tx.articleBase.create({
        data: {
          featuredImage: null,
          status: "DRAFT",
          isPublished: false,
          publishedAt: null,
          authorId: user.id,
          categorySlug: null, // AI生成的文章暂不设置分类
          tags: null, // AI生成的文章暂不设置标签
        },
      });

      // 创建 ArticleContent
      const articleContent = await tx.articleContent.create({
        data: {
          articleBaseId: articleBase.id,
          languageCode: trimmedLanguageCode,
          slug: baseSlug,
          title: trimmedTitle,
          content: generatedContent,
          excerpt: excerpt || null,
          seoTitle: null,
          seoDescription: null,
          seoKeyword: null,
        },
      });

      return {
        id: articleBase.id,
        contentId: articleContent.id,
        slug: articleContent.slug,
        title: articleContent.title,
        content: articleContent.content,
        excerpt: articleContent.excerpt,
        languageCode: articleContent.languageCode,
        featuredImage: articleBase.featuredImage,
        status: articleBase.status,
        isPublished: articleBase.isPublished,
        categorySlug: articleBase.categorySlug,
        tagSlugs: [],
        author: {
          id: user.id,
          username: user.username,
        },
        createdAt: articleBase.createdAt,
        updatedAt: articleBase.updatedAt,
      };
    });

    await prisma.articleAiGenerationLog.update({
      where: { id: generationLogId },
      data: {
        status: "SUCCESS",
        articleBaseId: result.id,
        articleContentId: result.contentId,
        generatedSlug: result.slug,
        contentLength: generatedContent.length,
        providerName: provider.name,
        completedAt: new Date(),
      },
    });

    console.info(
      `[AI写文章] 成功生成文章: ${result.title} (${result.id}), 记录ID: ${generationLogId}, 使用服务商: ${provider.name}, 内容长度: ${generatedContent.length} 字符`
    );

    return success(
      { ...result, generationLogId },
      "AI文章生成成功"
    );
  } catch (err: any) {
    console.error("[AI写文章] 错误:", err);
    if (generationLogId) {
      try {
        await prisma.articleAiGenerationLog.update({
          where: { id: generationLogId },
          data: {
            status: "FAILED",
            errorMessage: err.message || "AI文章生成失败",
            completedAt: new Date(),
          },
        });
      } catch (updateErr) {
        console.error("[AI写文章] 更新生成记录失败:", updateErr);
      }
    }
    return error(err.message || "AI文章生成失败");
  }
});
