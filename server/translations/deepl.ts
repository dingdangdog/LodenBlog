import type {
  TranslationClient,
  ExtendedTranslationProviderConfig,
} from "./types";
import { getProviderLanguageCode } from "./types";

/**
 * DeepL 翻译客户端
 *
 * 配置说明：
 * - apiKey: DeepL API Key（免费版或Pro版）
 * - apiEndpoint: 可选，默认为 "api-free.deepl.com"（免费版）或 "api.deepl.com"（Pro版）
 * - extraConfig.formality: 正式程度（"default", "more", "less"）
 *
 * API文档: https://www.deepl.com/docs-api
 */
export class DeepLTranslationClient implements TranslationClient {
  private readonly defaultFreeEndpoint = "api-free.deepl.com";
  private readonly defaultProEndpoint = "api.deepl.com";

  async translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error("DeepL翻译需要配置 apiKey");
    }

    const extraConfig = config.extraConfig
      ? JSON.parse(config.extraConfig)
      : {};
    const formality = extraConfig.formality || "default";

    // 转换语言代码
    const sourceLang = getProviderLanguageCode("deepl", from);
    const targetLang = getProviderLanguageCode("deepl", to);

    // 判断是免费版还是Pro版（通常Pro版API Key以 "fx" 开头）
    const isPro = config.apiKey.startsWith("fx");
    const endpoint =
      config.apiEndpoint ||
      (isPro ? this.defaultProEndpoint : this.defaultFreeEndpoint);

    // 构建请求URL
    const url = `https://${endpoint}/v2/translate`;

    // 构建请求参数
    const params = new URLSearchParams({
      auth_key: config.apiKey,
      text: text,
      source_lang: sourceLang,
      target_lang: targetLang,
      formality: formality,
    });

    // 发送请求
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DeepL API请求失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    if (result.message) {
      throw new Error(`DeepL API错误: ${result.message}`);
    }

    return result.translations?.[0]?.text || text;
  }
}
