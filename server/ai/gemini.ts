/**
 * Gemini API 调用（保持 fetch 实现，与 OpenAI SDK 分离）
 */
import type { TranslationProviderConfig } from "~~/server/translations/types";
import type { ChatOptions } from "./types";

const DEFAULT_ENDPOINT = "generativelanguage.googleapis.com";
const DEFAULT_MODEL = "gemini-pro";
const DEFAULT_TIMEOUT_MS = 30_000;

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

export async function chatWithGemini(
  prompt: string,
  config: TranslationProviderConfig,
  options?: ChatOptions
): Promise<string> {
  if (!config.apiKey) {
    throw new Error("AI 调用需要配置 apiKey");
  }

  const extra = parseExtraConfig(config);
  const model = (options?.model ?? extra.model) as string | undefined || DEFAULT_MODEL;
  const temperature = (options?.temperature ?? extra.temperature) as number | undefined ?? 0.3;
  const maxOutputTokens = (options?.maxTokens ?? extra.maxOutputTokens) as number | undefined ?? 16_384;

  const endpoint = config.apiEndpoint || DEFAULT_ENDPOINT;
  let baseUrl = endpoint.startsWith("http") ? endpoint.replace(/\/$/, "") : `https://${endpoint}`;
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  const timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "无法读取错误响应");
    throw new Error(`Gemini API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = (await response.json()) as {
    error?: { code?: string; message?: string };
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  if (result.error) {
    throw new Error(
      `Gemini API 错误: ${result.error.code ?? "未知"} - ${result.error.message ?? "未知错误"}`
    );
  }

  const candidate = result.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini API 返回的响应中没有候选结果");
  }

  const finishReason = candidate.finishReason;
  if (finishReason === "MAX_TOKENS") {
    console.warn(
      `[Gemini] 警告：生成的内容因达到最大 token 限制(${maxOutputTokens})而被截断。建议增加 maxOutputTokens 配置。`
    );
  } else if (finishReason && finishReason !== "STOP") {
    console.warn(`[Gemini] 生成完成原因: ${finishReason}。可能影响内容质量。`);
  }

  const text = candidate.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini API 返回空结果");
  }

  return text;
}
