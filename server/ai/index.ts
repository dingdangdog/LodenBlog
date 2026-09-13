/**
 * AI 服务层统一导出
 */
export { chat } from "./chat";
export { createOpenAICompatibleClient, chatWithOpenAICompatible } from "./openai-client";
export { chatWithGemini } from "./gemini";
export { getProviderConfigForAI } from "./provider";
export type { TranslationProviderConfig, ChatOptions } from "./types";
