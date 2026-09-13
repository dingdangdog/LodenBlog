import { success, error } from "~~/server/utils/result";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY, CONFIG_METADATA, type ConfigKey } from "~~/server/utils/config-keys";
import { requireAdmin } from "~~/server/utils/permission";
import { clearS3Client } from "~~/server/utils/r2";

/**
 * 更新系统配置
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const body = await readBody(event);
    const { configs } = body;

    if (!configs || typeof configs !== "object") {
      return error("配置数据格式错误");
    }

    // 验证配置键
    const updates: Record<ConfigKey, string | null> = {} as any;

    for (const [key, value] of Object.entries(configs)) {
      // 验证 key 是否有效
      if (!Object.values(CONFIG_KEY).includes(key as ConfigKey)) {
        return error(`无效的配置键: ${key}`);
      }

      const configKey = key as ConfigKey;
      const metadata = CONFIG_METADATA[configKey];

      // 如果是加密字段且值为 "***"，表示未修改，跳过
      if (metadata.isEncrypted && value === "***") {
        continue;
      }

      // 验证必填字段
      if (metadata.isRequired && (!value || value.trim() === "")) {
        return error(`${metadata.description} 是必填项`);
      }

      // 特殊验证：R2_SECRET_ID 必须是 32 字符
      if (configKey === CONFIG_KEY.R2_SECRET_ID && value && value !== "***") {
        if (value.trim().length !== 32) {
          return error("R2 Access Key ID 必须是 32 个字符");
        }
      }

      updates[configKey] = value === "" ? null : (value as string);
    }

    // 批量更新配置
    await configCache.setBatch(updates);

    // 刷新缓存
    await configCache.refresh();

    // 清除 R2 S3 客户端缓存，使新配置立即生效
    clearS3Client();

    return success(null, "系统配置更新成功，已立即生效");
  } catch (err: any) {
    return error(err.message || "更新系统配置失败");
  }
});
