import type {
  TranslationClient,
  ExtendedTranslationProviderConfig,
} from "./types";
import { getProviderLanguageCode } from "./types";
import {
  generateTranslationPrompt,
  generateSimpleTranslationPrompt,
  generateMarkdownTranslationPrompt,
} from "./prompts";

/**
 * Google Gemini 翻译客户端
 *
 * 配置说明：
 * - apiKey: Google Gemini API Key
 * - apiEndpoint: 可选，默认为 "generativelanguage.googleapis.com"
 * - extraConfig.model: 模型名称（如 "gemini-pro", "gemini-1.5-pro"）
 * - extraConfig.temperature: 温度参数（0-2，默认0.3）
 * - extraConfig.maxOutputTokens: 最大输出token数（默认8192，长文本会自动增加）
 *
 * API文档: https://ai.google.dev/docs
 */
export class GeminiTranslationClient implements TranslationClient {
  private readonly defaultEndpoint = "generativelanguage.googleapis.com";
  private readonly defaultModel = "gemini-pro";

  // 单个请求的最大输入token估算（保守估计，留出提示词和输出的空间）
  // Gemini API 的上下文窗口通常是 32K tokens，我们保守使用 20K 作为输入上限
  private readonly maxInputTokensEstimate = 20000;
  // 单个字符估算的token数（中文约1.5，英文约0.75，取平均值1.2）
  private readonly charsPerToken = 1.2;
  // 分块阈值：当文本长度超过这个值时，启用分块翻译
  private readonly chunkThreshold = Math.floor(
    this.maxInputTokensEstimate * this.charsPerToken * 0.7
  ); // 70%的安全阈值

  /**
   * 智能分块文本，尽量在段落或标题边界处分割
   */
  private splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let currentPos = 0;

    while (currentPos < text.length) {
      const remaining = text.length - currentPos;
      let chunkSize = Math.min(maxChunkSize, remaining);

      // 如果不是最后一块，尝试在合适的位置分割
      if (currentPos + chunkSize < text.length) {
        // 优先在双换行（段落边界）处分割
        const paragraphBreak = text.lastIndexOf("\n\n", currentPos + chunkSize);
        if (paragraphBreak > currentPos + chunkSize * 0.5) {
          chunkSize = paragraphBreak - currentPos + 2; // 包含两个换行符
        } else {
          // 其次在单换行处分割
          const lineBreak = text.lastIndexOf("\n", currentPos + chunkSize);
          if (lineBreak > currentPos + chunkSize * 0.7) {
            chunkSize = lineBreak - currentPos + 1; // 包含换行符
          } else {
            // 最后在句号、问号、感叹号处分割
            const searchText = text.substring(
              currentPos,
              currentPos + chunkSize
            );
            const sentenceEndPattern = /[。！？.!?]/g;
            let lastMatch: RegExpExecArray | null = null;
            let match: RegExpExecArray | null;
            
            // 找到最后一个匹配的句子结束符
            while ((match = sentenceEndPattern.exec(searchText)) !== null) {
              lastMatch = match;
            }
            
            if (lastMatch && lastMatch.index > chunkSize * 0.8) {
              chunkSize = lastMatch.index + 1; // 包含句子结束符
            }
          }
        }
      }

      chunks.push(text.substring(currentPos, currentPos + chunkSize));
      currentPos += chunkSize;
    }

    return chunks;
  }

  /**
   * 执行单次翻译请求
   */
  private async translateChunk(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig,
    model: string,
    temperature: number,
    maxOutputTokens: number
  ): Promise<string> {
    const sourceLang = getProviderLanguageCode("gemini", from);
    const targetLang = getProviderLanguageCode("gemini", to);
    
    // 根据内容类型选择不同的提示词
    // 标题使用简化提示词，正文使用完整Markdown提示词
    const contentType = config._translationOptions?.contentType || "content";
    const prompt =
      contentType === "title"
        ? generateSimpleTranslationPrompt(text, sourceLang, targetLang)
        : generateMarkdownTranslationPrompt(text, sourceLang, targetLang);

    const endpoint = config.apiEndpoint || this.defaultEndpoint;
    let baseUrl = `https://${endpoint}`;
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      baseUrl = endpoint.replace(/\/$/, "");
    }
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(config.timeout || 30000),
      });
    } catch (fetchError: any) {
      // 检查是否是超时错误
      if (
        fetchError.name === "TimeoutError" ||
        fetchError.name === "AbortError" ||
        fetchError.message?.includes("timeout") ||
        fetchError.message?.includes("aborted")
      ) {
        throw new Error(
          `Gemini API请求超时（${config.timeout || 30000}ms）。${
            fetchError.message || ""
          }`
        );
      }

      // 检查是否是网络连接错误
      const isConnectionError =
        fetchError.message?.includes("fetch failed") ||
        fetchError.message?.includes("ECONNREFUSED") ||
        fetchError.message?.includes("ENOTFOUND") ||
        fetchError.message?.includes("ETIMEDOUT") ||
        fetchError.message?.includes("ECONNRESET") ||
        fetchError.message?.includes("EHOSTUNREACH") ||
        fetchError.code === "ECONNREFUSED" ||
        fetchError.code === "ENOTFOUND" ||
        fetchError.code === "ETIMEDOUT" ||
        fetchError.code === "ECONNRESET" ||
        fetchError.code === "EHOSTUNREACH";

      if (isConnectionError) {
        throw new Error(
          `Gemini API网络连接失败: ${fetchError.message || "未知错误"}`
        );
      }

      throw new Error(
        `Gemini API网络请求失败: ${fetchError.message || "未知错误"}`
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "无法读取错误响应");
      throw new Error(
        `Gemini API请求失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(
        `Gemini API错误: ${result.error.code || "未知"} - ${
          result.error.message || "未知错误"
        }`
      );
    }

    const candidate = result.candidates?.[0];
    if (!candidate) {
      throw new Error("Gemini API返回的响应中没有候选结果");
    }

    const finishReason = candidate.finishReason;
    if (finishReason === "MAX_TOKENS") {
      console.warn(
        `[Gemini] 翻译结果因达到最大token限制(${maxOutputTokens})而被截断。建议增加 maxOutputTokens 或分块翻译。`
      );
    } else if (finishReason && finishReason !== "STOP") {
      console.warn(
        `[Gemini] 翻译完成原因: ${finishReason}。可能影响翻译质量。`
      );
    }

    // 记录token使用情况（如果可用）
    if (result.usageMetadata) {
      console.debug(
        `[Gemini] Token使用情况: 输入=${result.usageMetadata.promptTokenCount}, 输出=${result.usageMetadata.candidatesTokenCount}, 总计=${result.usageMetadata.totalTokenCount}`
      );
    }

    let translatedText = "";
    if (candidate.content?.parts) {
      translatedText = candidate.content.parts
        .map((part: any) => part.text || "")
        .join("")
        .trim();
    }

    if (!translatedText) {
      translatedText =
        candidate.content?.parts?.[0]?.text?.trim() ||
        result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        text;
    }

    if (!translatedText || translatedText.length === 0) {
      throw new Error("Gemini API返回空结果");
    }

    return translatedText;
  }

  async translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error("Gemini翻译需要配置 apiKey");
    }

    const extraConfig = config.extraConfig
      ? JSON.parse(config.extraConfig)
      : {};
    const model = extraConfig.model || this.defaultModel;
    const temperature = extraConfig.temperature ?? 0.3;
    // 根据文本长度动态调整 maxOutputTokens，确保长文章不会被截断
    // 估算：中文1字符≈1.5 tokens，英文1词≈1.3 tokens，翻译后通常会更长（约2-3倍）
    // 为了安全，我们使用更保守的估算：文本长度 * 3.5（增加安全系数），并设置上限
    const estimatedOutputTokens = Math.ceil(text.length * 3.5);
    // 至少8192，最大32768（Gemini API的限制），或根据文本长度计算
    const defaultMaxTokens = Math.min(
      32768,
      Math.max(8192, estimatedOutputTokens)
    );
    // 优先使用动态计算的值，配置值只作为最小值（如果配置值更大则使用配置值）
    const configuredMaxTokens = extraConfig.maxOutputTokens
      ? Number(extraConfig.maxOutputTokens)
      : null;
    const maxOutputTokens = configuredMaxTokens
      ? Math.max(configuredMaxTokens, defaultMaxTokens)
      : defaultMaxTokens;

    // 记录配置信息
    console.debug(
      `[Gemini] 翻译配置: 模型=${model}, 文本长度=${text.length}, maxOutputTokens=${maxOutputTokens}, 估算输出tokens=${estimatedOutputTokens}`
    );

    // 检查是否需要分块翻译
    const needsChunking = text.length > this.chunkThreshold;

    if (needsChunking) {
      console.info(
        `[Gemini] 文本较长(${text.length}字符)，启用分块翻译。分块阈值: ${this.chunkThreshold}`
      );

      // 计算每块的最大大小（留出提示词的空间）
      const chunkSize = Math.floor(this.chunkThreshold * 0.9);
      const chunks = this.splitTextIntoChunks(text, chunkSize);

      console.info(`[Gemini] 文本已分为 ${chunks.length} 块进行翻译`);

      // 翻译每个块
      const translatedChunks: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        console.info(`[Gemini] 正在翻译第 ${i + 1}/${chunks.length} 块...`);
        try {
          const translatedChunk = await this.translateChunk(
            chunks[i],
            from,
            to,
            config,
            model,
            temperature,
            maxOutputTokens
          );
          translatedChunks.push(translatedChunk);

          // 在块之间添加短暂延迟，避免API频率限制
          if (i < chunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error: any) {
          console.error(`[Gemini] 第 ${i + 1} 块翻译失败:`, error.message);
          throw new Error(
            `分块翻译失败（第 ${i + 1}/${chunks.length} 块）: ${error.message}`
          );
        }
      }

      // 合并翻译结果
      const result = translatedChunks.join("\n\n");
      console.info(
        `[Gemini] 分块翻译完成。原文长度: ${text.length}, 翻译长度: ${result.length}`
      );
      return result;
    }

    // 单次翻译（原有逻辑）
    return await this.translateChunk(
      text,
      from,
      to,
      config,
      model,
      temperature,
      maxOutputTokens
    );
  }
}
