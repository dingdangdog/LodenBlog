import type {
  TranslationClient,
  ExtendedTranslationProviderConfig,
} from "./types";
import { getProviderLanguageCode } from "./types";
import crypto from "crypto";

/**
 * 火山方舟翻译客户端
 *
 * 配置说明：
 * - apiKey: Access Key ID
 * - apiSecret: Secret Access Key
 * - apiEndpoint: 可选，默认为 "translate.volcengineapi.com"
 * - extraConfig.version: API版本（默认 "v1"）
 *
 * API文档: https://www.volcengine.com/docs/4640/6509
 */
export class VolcanoTranslationClient implements TranslationClient {
  private readonly defaultEndpoint = "translate.volcengineapi.com";
  private readonly defaultVersion = "2020-06-01";

  async translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string> {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error("火山方舟翻译需要配置 apiKey 和 apiSecret");
    }

    const extraConfig = config.extraConfig
      ? JSON.parse(config.extraConfig)
      : {};
    const version = extraConfig.version || this.defaultVersion;
    const endpoint = config.apiEndpoint || this.defaultEndpoint;

    // 转换语言代码
    const sourceLang = getProviderLanguageCode("volcano", from);
    const targetLang = getProviderLanguageCode("volcano", to);

    // 构建请求体
    const requestBody = {
      SourceLanguage: sourceLang,
      TargetLanguage: targetLang,
      TextList: [text],
    };

    // 生成签名
    const timestamp = Math.floor(Date.now() / 1000);
    const date =
      new Date(timestamp * 1000)
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0] + "Z";
    const credential = `${config.apiKey}/${
      date.split("T")[0]
    }/translate/request`;
    const signature = this.generateSignature(
      config.apiSecret,
      "POST",
      "/",
      "",
      date,
      credential,
      JSON.stringify(requestBody)
    );

    // 构建请求URL
    const url = `https://${endpoint}/`;

    // 构建请求头
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `HMAC-SHA256 Credential=${config.apiKey}/${
        date.split("T")[0]
      }/translate/request, SignedHeaders=content-type;host;x-date, Signature=${signature}`,
      "X-Date": date,
      Host: endpoint,
    };

    // 发送请求
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `火山方舟API请求失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    if (result.ResponseMetadata?.Error) {
      throw new Error(
        `火山方舟API错误: ${result.ResponseMetadata.Error.Code} - ${result.ResponseMetadata.Error.Message}`
      );
    }

    return result.TranslationList?.[0]?.Translation || text;
  }

  /**
   * 生成火山方舟API签名
   */
  private generateSignature(
    secretKey: string,
    method: string,
    uri: string,
    query: string,
    date: string,
    credential: string,
    payload: string
  ): string {
    // 构建待签名字符串
    const canonicalRequest = [
      method,
      uri,
      query,
      `content-type:application/json`,
      `host:${this.defaultEndpoint}`,
      `x-date:${date}`,
      "",
      "content-type;host;x-date",
      crypto.createHash("sha256").update(payload).digest("hex"),
    ].join("\n");

    // 构建签名字符串
    const stringToSign = [
      "HMAC-SHA256",
      date,
      credential,
      crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");

    // 计算签名
    const kDate = crypto
      .createHmac("sha256", secretKey)
      .update(date.split("T")[0])
      .digest();
    const kService = crypto
      .createHmac("sha256", kDate)
      .update("translate")
      .digest();
    const kSigning = crypto
      .createHmac("sha256", kService)
      .update("request")
      .digest();
    const signature = crypto
      .createHmac("sha256", kSigning)
      .update(stringToSign)
      .digest("hex");

    return signature;
  }
}
