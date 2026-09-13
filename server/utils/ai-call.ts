/**
 * 通用 AI 调用入口（兼容旧调用方）
 * 实际实现委托给 server/ai 统一层
 */
import type { TranslationProviderConfig } from "~~/server/translations/types";
import { chat } from "~~/server/ai";

/**
 * 使用配置的 AI 服务商根据提示词生成文本
 * 支持 OpenAI 兼容 API 与 Gemini
 *
 * @param prompt 完整提示词
 * @param config 翻译服务商配置（兼作 AI 配置）
 * @returns AI 返回的文本
 */
export async function callAIWithPrompt(
  prompt: string,
  config: TranslationProviderConfig
): Promise<string> {
  return chat(prompt, config);
}
