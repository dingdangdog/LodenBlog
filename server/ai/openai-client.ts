/**
 * OpenAI 兼容 API 客户端（基于官方 SDK）
 * 用于 OpenAI、DeepSeek 及任意兼容 OpenAI 格式的端点
 */
import OpenAI from "openai";
import type { TranslationProviderConfig } from "~~/server/translations/types";
import type { ChatOptions } from "./types";

const DEFAULT_MODEL = "gpt-3.5-turbo";
const DEFAULT_ENDPOINT = "https://api.openai.com";
// 默认超时时间适当放大，避免长文翻译频繁超时
const DEFAULT_TIMEOUT_MS = 120_000;
const MIN_TIMEOUT_MS = 10_000;

function parseExtraConfig(config: TranslationProviderConfig): Record<string, unknown> {
  if (!config.extraConfig || !config.extraConfig.trim()) {
    return {};
  }
  try {
    return JSON.parse(config.extraConfig) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * 计算本次请求的有效超时时间
 * 优先顺序：extraConfig.timeoutMs / extraConfig.timeout > config.timeout 字段 > 默认值
 * 并且会对异常值（<=0 或 NaN）做兜底，保证不少于 MIN_TIMEOUT_MS
 */
function getEffectiveTimeout(config: TranslationProviderConfig): number {
  const extra = parseExtraConfig(config) as any;

  let timeout: number | undefined =
    typeof config.timeout === "number" ? config.timeout : undefined;

  const extraTimeout =
    typeof extra?.timeoutMs === "number"
      ? extra.timeoutMs
      : typeof extra?.timeout === "number"
        ? extra.timeout
        : undefined;

  if (typeof extraTimeout === "number" && Number.isFinite(extraTimeout)) {
    timeout = extraTimeout;
  }

  if (!timeout || !Number.isFinite(timeout) || timeout <= 0) {
    timeout = DEFAULT_TIMEOUT_MS;
  }

  if (timeout < MIN_TIMEOUT_MS) {
    timeout = MIN_TIMEOUT_MS;
  }

  return timeout;
}

/**
 * 根据配置构建 BaseURL（SDK 会在此后追加 /chat/completions 等路径）
 * 配置中的 apiEndpoint 可能是：
 * - "api.openai.com" -> https://api.openai.com/v1
 * - "https://my-proxy.com" -> https://my-proxy.com/v1
 */
function buildBaseURL(config: TranslationProviderConfig): string {
  const raw = config.apiEndpoint || "api.openai.com";
  let base = raw.trim();
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  base = base.replace(/\/$/, "");
  if (!base.endsWith("/v1")) {
    base = `${base}/v1`;
  }
  return base;
}

/**
 * 创建 OpenAI 兼容客户端实例（每次调用可新建，便于不同 config）
 */
export function createOpenAICompatibleClient(config: TranslationProviderConfig): OpenAI {
  const baseURL = buildBaseURL(config);
  const timeout = getEffectiveTimeout(config);

  return new OpenAI({
    apiKey: config.apiKey ?? undefined,
    baseURL,
    timeout,
  });
}

/**
 * 使用 OpenAI 兼容 API 发送单轮对话，返回助手回复文本
 */
export async function chatWithOpenAICompatible(
  prompt: string,
  config: TranslationProviderConfig,
  options?: ChatOptions
): Promise<string> {
  if (!config.apiKey) {
    throw new Error("AI 调用需要配置 apiKey");
  }
  // console.log("config", config);
  // console.log("options", options);
  const extra = parseExtraConfig(config);
  const model = (options?.model ?? extra.model) as string | undefined || DEFAULT_MODEL;
  const temperature = (options?.temperature ?? extra.temperature) as number | undefined ?? 0.3;
  const maxTokens = (options?.maxTokens ?? extra.maxTokens) as number | undefined ?? 8000;

  const client = createOpenAICompatibleClient(config);

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature,
    max_tokens: maxTokens,
  });

  const choice = completion.choices?.[0];
  if (!choice) {
    throw new Error("API 返回的响应中没有选项");
  }

  const content = choice.message?.content;
  if (content == null || String(content).trim() === "") {
    throw new Error("API 返回的响应中没有内容");
  }

  const finishReason = choice.finish_reason;
  if (finishReason === "length") {
    console.warn(
      `[OpenAI] 警告：生成的内容因达到最大 token 限制(${maxTokens})而被截断。建议增加 maxTokens 配置。`
    );
  } else if (finishReason && finishReason !== "stop") {
    console.warn(`[OpenAI] 生成完成原因: ${finishReason}。可能影响内容质量。`);
  }

  return String(content).trim();
}
