import type {
  TranslationClient,
  ExtendedTranslationProviderConfig,
} from "./types";
import { getProviderLanguageCode } from "./types";
import crypto from "crypto";

/**
 * 腾讯翻译客户端
 *
 * 配置说明：
 * - apiKey: SecretId（腾讯云API密钥ID）
 * - apiSecret: SecretKey（腾讯云API密钥）
 * - apiEndpoint: 可选，默认为 "tmt.tencentcloudapi.com"
 * - extraConfig.projectId: 项目ID（可选）
 *
 * API文档: https://cloud.tencent.com/document/product/551
 */
export class TencentTranslationClient implements TranslationClient {
  private readonly defaultEndpoint = "tmt.tencentcloudapi.com";
  private readonly defaultRegion = "ap-beijing";

  async translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string> {
    // 验证配置
    if (!config.apiKey || !config.apiSecret) {
      throw new Error(
        "腾讯翻译需要配置 apiKey (SecretId) 和 apiSecret (SecretKey)"
      );
    }

    const extraConfig = config.extraConfig
      ? JSON.parse(config.extraConfig)
      : {};
    const projectId = extraConfig.projectId || 0;
    const endpoint = config.apiEndpoint || this.defaultEndpoint;
    const region = extraConfig.region || this.defaultRegion;

    // 验证配置格式并输出调试信息
    console.info(
      `[翻译] 腾讯翻译配置检查: apiKey长度=${config.apiKey.length}, apiSecret长度=${config.apiSecret.length}, endpoint=${endpoint}, region=${region}`
    );

    // 验证配置格式（SecretId通常以AKID开头）
    if (!config.apiKey.startsWith("AKID") && config.apiKey.length < 20) {
      console.warn(
        `[翻译] 警告: apiKey (SecretId) 格式可能不正确，通常以 "AKID" 开头且长度大于20。当前值: ${config.apiKey.substring(
          0,
          10
        )}...`
      );
    }

    // 验证SecretKey长度（通常为40字符）
    if (config.apiSecret.length < 30) {
      console.warn(
        `[翻译] 警告: apiSecret (SecretKey) 长度可能不正确，通常为40字符。当前长度: ${config.apiSecret.length}`
      );
    }

    // 转换语言代码
    const sourceLang = getProviderLanguageCode("tencent", from);
    const targetLang = getProviderLanguageCode("tencent", to);

    // 构建请求URL（确保 endpoint 不包含协议前缀）
    let cleanEndpoint = endpoint.trim();
    // 移除可能存在的 https:// 或 http:// 前缀
    cleanEndpoint = cleanEndpoint.replace(/^https?:\/\//i, "");
    // 移除末尾的斜杠
    cleanEndpoint = cleanEndpoint.replace(/\/$/, "");

    // 构建请求体（JSON格式）
    const requestBody = {
      SourceText: text,
      Source: sourceLang,
      Target: targetLang,
      ProjectId: projectId,
    };

    const action = "TextTranslate";
    const service = "tmt";
    const version = "2018-03-21";
    const timestamp = Math.floor(Date.now() / 1000);

    // 获取日期，格式：YYYY-MM-DD（根据官方示例代码）
    const dateObj = new Date(timestamp * 1000);
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getUTCDate()).padStart(2, "0");
    const date = `${year}-${month}-${day}`;

    // 生成TC3签名
    const authorization = this.generateTC3Signature(
      config.apiKey,
      config.apiSecret,
      service,
      region,
      action,
      version,
      timestamp,
      date,
      requestBody,
      cleanEndpoint
    );

    const url = `https://${cleanEndpoint}/`;

    // 发送POST请求
    let response: Response;
    try {
      console.info(
        `[翻译] 腾讯翻译请求: URL=${url}, 方法=POST, 文本长度=${
          text.length
        }, 超时=${config.timeout || 30000}ms`
      );
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Host: cleanEndpoint,
          "X-TC-Action": action,
          "X-TC-Version": version,
          "X-TC-Timestamp": timestamp.toString(),
          "X-TC-Region": region,
          Authorization: authorization,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(config.timeout || 30000),
      });
    } catch (fetchError: any) {
      // 捕获网络错误、超时等，记录详细信息
      const errorDetails: string[] = [];
      errorDetails.push(`错误类型: ${fetchError.name || "Unknown"}`);
      errorDetails.push(`错误消息: ${fetchError.message || "无消息"}`);

      if (fetchError.cause) {
        errorDetails.push(`原因: ${JSON.stringify(fetchError.cause)}`);
      }

      if (fetchError.code) {
        errorDetails.push(`错误代码: ${fetchError.code}`);
      }

      if (fetchError.errno) {
        errorDetails.push(`系统错误号: ${fetchError.errno}`);
      }

      if (fetchError.syscall) {
        errorDetails.push(`系统调用: ${fetchError.syscall}`);
      }

      if (fetchError.hostname) {
        errorDetails.push(`主机名: ${fetchError.hostname}`);
      }

      // 记录完整的错误信息用于调试
      console.error(`[翻译] 腾讯翻译fetch失败详情:`, {
        name: fetchError.name,
        message: fetchError.message,
        code: fetchError.code,
        errno: fetchError.errno,
        syscall: fetchError.syscall,
        hostname: fetchError.hostname,
        cause: fetchError.cause,
        stack: fetchError.stack?.split("\n").slice(0, 3).join("\n"), // 只记录前3行堆栈
      });

      // 根据错误类型提供更具体的错误信息
      if (
        fetchError.name === "TimeoutError" ||
        fetchError.name === "AbortError"
      ) {
        throw new Error(
          `腾讯翻译API请求超时（${
            config.timeout || 30000
          }ms）: ${errorDetails.join(", ")}`
        );
      }

      if (fetchError.code === "ENOTFOUND" || fetchError.code === "EAI_AGAIN") {
        throw new Error(
          `腾讯翻译API DNS解析失败: ${errorDetails.join(
            ", "
          )}。请检查网络连接和DNS设置。`
        );
      }

      if (fetchError.code === "ECONNREFUSED") {
        throw new Error(
          `腾讯翻译API连接被拒绝: ${errorDetails.join(
            ", "
          )}。请检查防火墙和代理设置。`
        );
      }

      if (fetchError.code === "ECONNRESET" || fetchError.code === "ETIMEDOUT") {
        throw new Error(
          `腾讯翻译API连接失败: ${errorDetails.join(
            ", "
          )}。可能是网络不稳定或服务器问题。`
        );
      }

      throw new Error(
        `腾讯翻译API网络请求失败: ${errorDetails.join(
          ", "
        )}。原始错误: ${fetchError.toString()}`
      );
    }

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `无法读取错误响应: ${e}`;
      }
      throw new Error(
        `腾讯翻译API请求失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    let result: any;
    try {
      result = await response.json();
    } catch (parseError: any) {
      throw new Error(
        `腾讯翻译API响应解析失败: ${
          parseError.message || parseError.toString()
        }`
      );
    }

    if (result.Response?.Error) {
      throw new Error(
        `腾讯翻译API错误: ${result.Response.Error.Code} - ${result.Response.Error.Message}`
      );
    }

    return result.Response?.TargetText || text;
  }

  /**
   * 生成腾讯云API 3.0 TC3-HMAC-SHA256签名
   *
   * 参考文档: https://cloud.tencent.com/document/api/551/15619
   *
   * 签名算法步骤：
   * 1. 构建规范请求（CanonicalRequest）
   * 2. 构建待签名字符串（StringToSign）
   * 3. 计算签名（Signature）
   * 4. 构建Authorization头
   */
  private generateTC3Signature(
    secretId: string,
    secretKey: string,
    service: string,
    region: string,
    action: string,
    version: string,
    timestamp: number,
    date: string,
    requestBody: Record<string, any>,
    endpoint: string
  ): string {
    // 1. 构建规范请求（CanonicalRequest）
    const httpRequestMethod = "POST";
    const canonicalUri = "/";
    const canonicalQueryString = "";
    const payload = JSON.stringify(requestBody);
    const payloadHash = crypto
      .createHash("sha256")
      .update(payload)
      .digest("hex");

    // 根据官方文档示例代码，CanonicalHeaders需要包含所有参与签名的头
    // 按小写字母顺序排列，每个头一行，最后加一个换行符
    // Content-Type 应该包含 charset=utf-8
    const canonicalHeaders =
      [
        `content-type:application/json; charset=utf-8`,
        `host:${endpoint}`,
        `x-tc-action:${action.toLowerCase()}`,
      ].join("\n") + "\n";

    // SignedHeaders 列出所有参与签名的头，按字母顺序，用分号分隔
    // 根据官方文档示例，应该包含 x-tc-action
    const signedHeaders = "content-type;host;x-tc-action";

    const canonicalRequest = [
      httpRequestMethod,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    // 2. 构建待签名字符串（StringToSign）
    const algorithm = "TC3-HMAC-SHA256";
    // date 已经是 YYYY-MM-DD 格式，直接使用
    const credentialScope = `${date}/${service}/tc3_request`;
    const hashedCanonicalRequest = crypto
      .createHash("sha256")
      .update(canonicalRequest)
      .digest("hex");
    const stringToSign = [
      algorithm,
      timestamp.toString(),
      credentialScope,
      hashedCanonicalRequest,
    ].join("\n");

    // 3. 计算签名（Signature）
    // 根据官方示例，使用 'TC3' + SECRET_KEY 作为密钥，date 作为消息
    const kDate = crypto
      .createHmac("sha256", `TC3${secretKey}`)
      .update(date)
      .digest();
    const kService = crypto
      .createHmac("sha256", kDate)
      .update(service)
      .digest();
    const kSigning = crypto
      .createHmac("sha256", kService)
      .update("tc3_request")
      .digest();
    const signature = crypto
      .createHmac("sha256", kSigning)
      .update(stringToSign)
      .digest("hex");

    // 4. 构建Authorization头
    const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // 调试信息
    console.info(
      `[翻译] TC3签名信息: service=${service}, region=${region}, action=${action}, timestamp=${timestamp}`
    );

    return authorization;
  }
}
