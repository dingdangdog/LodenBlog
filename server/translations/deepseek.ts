import type {
  TranslationClient,
  ExtendedTranslationProviderConfig,
} from "./types";
import { getProviderLanguageCode } from "./types";
import {
  generateSimpleTranslationPrompt,
  generateMarkdownTranslationPrompt,
} from "./prompts";
import { chatWithOpenAICompatible } from "~~/server/ai";

/**
 * DeepSeek 翻译客户端（基于 OpenAI 兼容 API）
 *
 * 配置说明：
 * - apiKey: DeepSeek API Key
 * - apiEndpoint: 可选，默认为 "api.deepseek.com"
 * - extraConfig.model: 模型名称（如 "deepseek-chat", "deepseek-reasoner"）
 *   - deepseek-chat: DeepSeek-V3.2 非思考模式（默认）
 *   - deepseek-reasoner: DeepSeek-V3.2 思考模式
 * - extraConfig.temperature: 温度参数（0-2，默认0.3）
 * - extraConfig.maxTokens: 最大 token 数（默认4000）
 *
 * API 文档: https://platform.deepseek.com/api_keys
 */
export class DeepSeekTranslationClient implements TranslationClient {
  private readonly defaultModel = "deepseek-chat";

  async translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string> {
    const sourceLang = getProviderLanguageCode("deepseek", from);
    const targetLang = getProviderLanguageCode("deepseek", to);

    const contentType = config._translationOptions?.contentType || "content";
    const prompt =
      contentType === "title"
        ? generateSimpleTranslationPrompt(text, sourceLang, targetLang)
        : generateMarkdownTranslationPrompt(text, sourceLang, targetLang);

    return chatWithOpenAICompatible(prompt, config, {
      model: this.defaultModel,
      temperature: 0.3,
      maxTokens: 4000,
    });
  }
}
