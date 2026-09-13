import type {
  TranslationClient,
  ExtendedTranslationProviderConfig,
} from "./types";
import { getProviderLanguageCode } from "./types";
import crypto from "crypto";

/**
 * 百度翻译客户端
 *
 * 配置说明：
 * - apiKey: App ID（百度翻译应用ID）
 * - apiSecret: Secret Key（百度翻译密钥）
 * - apiEndpoint: 可选，默认为 "fanyi-api.baidu.com"
 * - extraConfig.domain: 翻译领域（"general" 通用, "medicine" 医学, "electronics" 电子等，默认 "general"）
 *
 * API文档: https://fanyi-api.baidu.com/doc/21
 */
export class BaiduTranslationClient implements TranslationClient {
  private readonly defaultEndpoint = "fanyi-api.baidu.com";

  async translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string> {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error(
        "百度翻译需要配置 apiKey (App ID) 和 apiSecret (Secret Key)"
      );
    }

    const extraConfig = config.extraConfig
      ? JSON.parse(config.extraConfig)
      : {};
    const domain = extraConfig.domain || "general";

    // 转换语言代码
    const sourceLang = getProviderLanguageCode("baidu", from);
    const targetLang = getProviderLanguageCode("baidu", to);

    // 生成签名
    const salt = Math.floor(Math.random() * 10000000000).toString();
    const signString = config.apiKey + text + salt + config.apiSecret;
    const sign = crypto.createHash("md5").update(signString).digest("hex");

    // 构建请求URL
    const endpoint = config.apiEndpoint || this.defaultEndpoint;
    const url = `https://${endpoint}/api/trans/vip/translate`;

    // 构建请求参数
    const params = new URLSearchParams({
      q: text,
      from: sourceLang,
      to: targetLang,
      appid: config.apiKey,
      salt: salt,
      sign: sign,
      domain: domain,
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
        `百度翻译API请求失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    if (result.error_code) {
      throw new Error(
        `百度翻译API错误: ${result.error_code} - ${
          result.error_msg || "未知错误"
        }`
      );
    }

    return result.trans_result?.[0]?.dst || text;
  }
}
