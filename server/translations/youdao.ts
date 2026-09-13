import type {
  TranslationClient,
  ExtendedTranslationProviderConfig,
} from "./types";
import { getProviderLanguageCode } from "./types";
import crypto from "crypto";

/**
 * 有道翻译客户端
 *
 * 配置说明：
 * - apiKey: 应用ID（App Key）
 * - apiSecret: 应用密钥（App Secret）
 * - apiEndpoint: 可选，默认为 "openapi.youdao.com"
 * - extraConfig.version: API版本（默认 "v1"）
 *
 * API文档: https://ai.youdao.com/DOCSIRMA/html/自然语言翻译/API文档/文本翻译服务/文本翻译服务-API文档.html
 */
export class YoudaoTranslationClient implements TranslationClient {
  private readonly defaultEndpoint = "openapi.youdao.com";

  async translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string> {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error(
        "有道翻译需要配置 apiKey (App Key) 和 apiSecret (App Secret)"
      );
    }

    const extraConfig = config.extraConfig
      ? JSON.parse(config.extraConfig)
      : {};

    // 转换语言代码
    const sourceLang = getProviderLanguageCode("youdao", from);
    const targetLang = getProviderLanguageCode("youdao", to);

    // 生成签名
    const salt = Date.now().toString();
    const curtime = Math.floor(Date.now() / 1000).toString();
    const signStr =
      config.apiKey + this.truncate(text) + salt + curtime + config.apiSecret;
    const sign = crypto
      .createHash("sha256")
      .update(signStr)
      .digest("hex")
      .toUpperCase();

    // 构建请求URL
    const endpoint = config.apiEndpoint || this.defaultEndpoint;
    const url = `https://${endpoint}/api`;

    // 构建请求参数
    const params = new URLSearchParams({
      q: text,
      from: sourceLang,
      to: targetLang,
      appKey: config.apiKey,
      salt: salt,
      sign: sign,
      signType: "v3",
      curtime: curtime,
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
        `有道翻译API请求失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    if (result.errorCode && result.errorCode !== "0") {
      throw new Error(
        `有道翻译API错误: ${result.errorCode} - ${
          result.errorMsg || "未知错误"
        }`
      );
    }

    return result.translation?.[0] || text;
  }

  /**
   * 截断文本（用于签名计算）
   * 如果文本长度小于等于20，直接返回
   * 如果文本长度大于20，返回前10个字符 + 文本长度 + 后10个字符
   */
  private truncate(text: string): string {
    if (text.length <= 20) {
      return text;
    }
    return (
      text.substring(0, 10) + text.length + text.substring(text.length - 10)
    );
  }
}
