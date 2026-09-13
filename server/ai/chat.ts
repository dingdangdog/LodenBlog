/**
 * 统一 AI 对话入口：根据 provider 分发到 OpenAI 兼容或 Gemini
 */
import type { TranslationProviderConfig } from "~~/server/translations/types";
import type { ChatOptions } from "./types";
import { chatWithOpenAICompatible } from "./openai-client";
import { chatWithGemini } from "./gemini";

/**
 * 使用配置的 AI 服务商发送单轮对话，返回助手回复文本
 * - provider === "gemini" 时走 Gemini API
 * - 其余（openai、deepseek 及未配置的）走 OpenAI 兼容 API（SDK）
 */
export async function chat(
  prompt: string,
  config: TranslationProviderConfig,
  options?: ChatOptions
): Promise<string> {
  if (config.provider === "gemini") {
    return chatWithGemini(prompt, config, options);
  }
  return chatWithOpenAICompatible(prompt, config, options);
}
