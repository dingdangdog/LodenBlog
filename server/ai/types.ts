/**
 * AI 服务层类型
 * 复用翻译服务商配置，供 OpenAI 兼容 API 与 Gemini 使用
 */
import type { TranslationProviderConfig } from "~~/server/translations/types";

export type { TranslationProviderConfig };

export interface ChatOptions {
  /** 最大 token 数（OpenAI 兼容）或 maxOutputTokens（Gemini） */
  maxTokens?: number;
  /** 温度 0-2 */
  temperature?: number;
  /** 模型名（可选，覆盖 extraConfig 中的 model） */
  model?: string;
}
