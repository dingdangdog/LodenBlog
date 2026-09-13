import type {
  TranslationClient,
  ExtendedTranslationProviderConfig,
} from "./types";
import { getProviderLanguageCode } from "./types";
import { generateTranslationPrompt } from "./prompts";
import { chatWithOpenAICompatible } from "~~/server/ai";

/**
 * OpenAI 翻译客户端（基于 OpenAI SDK 的兼容实现）
 *
 * 配置说明：
 * - apiKey: OpenAI API Key
 * - apiEndpoint: 可选，默认为 "api.openai.com"，支持自定义端点（如代理）
 * - extraConfig.model: 模型名称（如 "gpt-4", "gpt-3.5-turbo"）
 * - extraConfig.temperature: 温度参数（0-2，默认0.3）
 * - extraConfig.maxTokens: 最大 token 数（默认 4000）
 *
 * API 文档: https://platform.openai.com/docs/api-reference
 */
export class OpenAITranslationClient implements TranslationClient {
  async translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string> {
    const sourceLang = getProviderLanguageCode("openai", from);
    const targetLang = getProviderLanguageCode("openai", to);
    const prompt = generateTranslationPrompt(text, sourceLang, targetLang);

    return chatWithOpenAICompatible(prompt, config, {
      temperature: 0.3,
      maxTokens: 4000,
    });
  }
}
