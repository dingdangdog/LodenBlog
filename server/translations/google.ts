import type {
  TranslationClient,
  ExtendedTranslationProviderConfig,
} from "./types";
import { getProviderLanguageCode } from "./types";

/**
 * Google Translate 翻译客户端
 *
 * 配置说明：
 * - apiKey: Google Cloud API Key
 * - apiEndpoint: 可选，默认为 "translation.googleapis.com"
 * - extraConfig.format: 文本格式（"text" 或 "html"，默认 "text"）
 *
 * API文档: https://cloud.google.com/translate/docs
 */
export class GoogleTranslationClient implements TranslationClient {
  private readonly defaultEndpoint = "translation.googleapis.com";

  async translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error("Google翻译需要配置 apiKey");
    }

    const extraConfig = config.extraConfig
      ? JSON.parse(config.extraConfig)
      : {};
    const format = extraConfig.format || "text";

    // 转换语言代码
    const sourceLang = getProviderLanguageCode("google", from);
    const targetLang = getProviderLanguageCode("google", to);

    // 构建请求URL
    const endpoint = config.apiEndpoint || this.defaultEndpoint;
    const url = `https://${endpoint}/language/translate/v2`;

    // 构建请求参数
    const params = new URLSearchParams({
      key: config.apiKey,
      q: text,
      source: sourceLang,
      target: targetLang,
      format: format,
    });

    // 发送请求
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Google翻译API请求失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(
        `Google翻译API错误: ${result.error.code} - ${result.error.message}`
      );
    }

    return result.data?.translations?.[0]?.translatedText || text;
  }
}
