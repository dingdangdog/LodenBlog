import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { configCache } from "./config-cache";
import { CONFIG_KEY } from "./config-keys";

// 初始化 S3 客户端（Cloudflare R2 兼容 S3 API）
let s3Client: S3Client | null = null;

/**
 * 清除 S3 客户端缓存
 * 当配置更新时调用此方法，强制下次使用时重新创建客户端
 */
export const clearS3Client = () => {
  s3Client = null;
};

/**
 * 获取 R2 配置（从缓存读取）
 */
const getR2Config = () => {
  const url = configCache.get(CONFIG_KEY.R2_URL);
  const secretId = configCache.get(CONFIG_KEY.R2_SECRET_ID);
  const secretKey = configCache.get(CONFIG_KEY.R2_SECRET_KEY);
  const token = configCache.get(CONFIG_KEY.R2_TOKEN);
  const bucket = configCache.getWithDefault(CONFIG_KEY.R2_BUCKET, "aitlog-images");

  return {
    url,
    secretId,
    secretKey,
    token,
    bucket,
  };
};

/**
 * 获取 R2 文件的完整 URL
 * @param objectKey 文件路径（相对于 bucket 的路径）
 * @returns 完整的 URL
 */
export const getR2FileUrl = (objectKey: string): string => {
  const domain = configCache.get(CONFIG_KEY.R2_DOMAIN) || "";
  const trimmedDomain = domain.replace(/\/+$/, "");
  const hasProtocol = /^https?:\/\//i.test(trimmedDomain);
  const base = trimmedDomain
    ? hasProtocol
      ? trimmedDomain
      : `https://${trimmedDomain}`
    : "";
  return base ? `${base}/${objectKey}` : objectKey;
};

export const getS3Client = () => {
  if (s3Client) {
    return s3Client;
  }

  const r2Config = getR2Config();

  // 检查必要的配置：secretId 和 secretKey 用于 S3 API，token 用于 HTTP API
  if (!r2Config.url) {
    throw new Error(
      "Cloudflare R2 URL 未配置，请在系统配置中设置 R2_URL"
    );
  }

  // S3 API 需要 secretId 和 secretKey
  if (!r2Config.secretId || !r2Config.secretKey) {
    throw new Error(
      "Cloudflare R2 S3 API 配置不完整，请在系统配置中设置 R2_SECRET_ID 和 R2_SECRET_KEY"
    );
  }

  // Token 用于 HTTP API 访问（可选，但建议配置）
  if (!r2Config.token) {
    console.warn("警告: R2 token 未配置，HTTP API 访问功能将不可用");
  }

  // 验证 Access Key ID 长度 (secretId 是 Access Key ID)
  const accessKeyId = r2Config.secretId.trim();
  if (accessKeyId.length !== 32) {
    throw new Error(
      `R2 Access Key ID 长度错误！当前长度: ${accessKeyId.length}，应为 32 个字符。\n` +
        `请检查系统配置中的 R2_SECRET_ID，应为 32 个字符的 Access Key ID。\n` +
        `请按以下步骤获取正确的 Access Key ID：\n` +
        `1. 登录 Cloudflare Dashboard\n` +
        `2. 进入 R2 -> Manage R2 API Tokens\n` +
        `3. 点击 "Create API token"\n` +
        `4. 选择 "Object Read & Write" 权限\n` +
        `5. 创建后会显示 Access Key ID (32字符) 和 Secret Access Key\n` +
        `6. 将 Access Key ID 填入系统配置的 R2_SECRET_ID，Secret Access Key 填入 R2_SECRET_KEY`
    );
  }

  // R2 endpoint URL
  const endpoint = r2Config.url.trim();

  s3Client = new S3Client({
    region: "auto", // R2 使用 "auto"
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: r2Config.secretKey.trim(),
    },
  });

  return s3Client;
};

/**
 * 上传文件到 R2
 * @param buffer 文件缓冲区
 * @param key 文件路径（相对于 bucket 的路径）
 * @param contentType MIME 类型
 * @returns Promise<void>
 */
export const uploadToR2 = async (
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<void> => {
  try {
    const client = getS3Client();
    const r2Config = getR2Config();
    const bucket = r2Config.bucket;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await client.send(command);
  } catch (error: any) {
    // 提供更友好的错误信息
    if (error.message?.includes("Credential access key has length")) {
      throw new Error(
        `R2 凭证配置错误：Access Key ID 长度不正确。\n` +
          `请确保系统配置中的 R2_SECRET_ID 是 32 个字符的 Access Key ID。\n` +
          `原始错误: ${error.message}`
      );
    }
    if (error.code === "InvalidArgument" && error.message?.includes("length")) {
      throw new Error(
        `R2 凭证配置错误：Access Key ID 长度不正确。\n` +
          `请检查系统配置中的 R2_SECRET_ID，应为 32 个字符。\n` +
          `原始错误: ${error.message}`
      );
    }
    // 重新抛出其他错误
    throw error;
  }
};

/**
 * 从 R2 删除文件
 * @param key 文件路径
 * @returns Promise<void>
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  const client = getS3Client();
  const r2Config = getR2Config();
  const bucket = r2Config.bucket;

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
};

/**
 * 获取 R2 文件的公共 URL
 * @param filename 文件名（不包含路径）
 * @param folder 文件夹（origin 或 thumb）
 * @returns 完整的 URL
 */
export const getR2PublicUrl = (
  filename: string,
  folder: "origin" | "thumb" = "origin"
): string => {
  const domain = configCache.get(CONFIG_KEY.R2_DOMAIN) || "pix.aitlog.com";

  // 确保 filename 不包含路径前缀
  const cleanFilename = filename.split("/").pop() || filename;

  return `https://${domain}/${folder}/${cleanFilename}`;
};

/**
 * 通过 HTTP API 使用 token 访问 R2 文件
 * @param key 文件路径（相对于 bucket 的路径）
 * @returns Promise<Buffer>
 */
export const fetchFromR2WithToken = async (key: string): Promise<Buffer> => {
  const r2Config = getR2Config();

  if (!r2Config.token || !r2Config.url) {
    throw new Error("R2 token 或 URL 未配置，请在系统配置中设置 R2_TOKEN 和 R2_URL");
  }

  const url = `${r2Config.url}/${r2Config.bucket}/${key}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${r2Config.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`R2 访问失败: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
