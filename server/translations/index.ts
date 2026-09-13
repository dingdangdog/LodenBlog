import type {
  TranslationClient,
  TranslationProviderConfig,
  ExtendedTranslationProviderConfig,
  TranslationOptions,
} from "./types";
import { OpenAITranslationClient } from "./openai";
import { DeepLTranslationClient } from "./deepl";
import { VolcanoTranslationClient } from "./volcano";
import { GoogleTranslationClient } from "./google";
import { BaiduTranslationClient } from "./baidu";
import { TencentTranslationClient } from "./tencent";
import { YoudaoTranslationClient } from "./youdao";
import { GeminiTranslationClient } from "./gemini";
import { DeepSeekTranslationClient } from "./deepseek";

/**
 * 已定制配置的服务商列表
 */
const CUSTOMIZED_PROVIDERS = [
  "openai",
  "openai-gpt35",
  "deepl",
  "volcano",
  "google",
  "baidu",
  "tencent",
  "youdao",
  "gemini",
  "deepseek",
];

/**
 * 翻译客户端工厂
 * 根据服务商标识创建对应的客户端实例
 * 如果服务商没有定制配置，默认使用 OpenAI 客户端（兼容 OpenAI API 格式）
 */
export function createTranslationClient(provider: string): TranslationClient {
  const isCustomized = CUSTOMIZED_PROVIDERS.includes(provider);

  switch (provider) {
    case "openai":
    case "openai-gpt35":
      return new OpenAITranslationClient();
    case "deepl":
      return new DeepLTranslationClient();
    case "volcano":
      return new VolcanoTranslationClient();
    case "google":
      return new GoogleTranslationClient();
    case "baidu":
      return new BaiduTranslationClient();
    case "tencent":
      return new TencentTranslationClient();
    case "youdao":
      return new YoudaoTranslationClient();
    case "gemini":
      return new GeminiTranslationClient();
    case "deepseek":
      return new DeepSeekTranslationClient();
    default:
      // 如果服务商没有定制配置，默认使用 OpenAI 客户端（兼容 OpenAI API 格式）
      if (!isCustomized) {
        console.info(
          `[翻译] 服务商 ${provider} 没有定制配置，使用 OpenAI 兼容客户端`
        );
      }
      return new OpenAITranslationClient();
  }
}

/**
 * 翻译文本（无重试，直接调用）
 * @param text 要翻译的文本
 * @param from 源语言代码
 * @param to 目标语言代码
 * @param config 服务商配置
 * @param options 翻译选项（可选）
 */
export async function translateWithRetry(
  text: string,
  from: string,
  to: string,
  config: TranslationProviderConfig,
  options?: TranslationOptions
): Promise<string> {
  // 如果服务商没有定制配置，使用 OpenAI 客户端（兼容 OpenAI API 格式）
  const client = createTranslationClient(config.provider);

  const contentType = options?.contentType || "content";
  // 判断是否使用了默认的 OpenAI 客户端
  const isUsingDefaultClient = !CUSTOMIZED_PROVIDERS.includes(config.provider);
  const actualProvider = isUsingDefaultClient
    ? `${config.provider} (使用 OpenAI 兼容客户端)`
    : config.provider;

  console.info(
    `[翻译] 使用 ${config.name} (${actualProvider}) 翻译 ${from} -> ${to}，文本长度: ${text.length}，内容类型: ${contentType}`
  );

  // 创建扩展配置，包含临时选项
  const extendedConfig: ExtendedTranslationProviderConfig = {
    ...config,
    _translationOptions: options,
  };

  try {
    const result = await client.translate(text, from, to, extendedConfig);
    return result;
  } catch (error: any) {
    // 重新抛出错误，让调用者处理
    throw error;
  }
}
