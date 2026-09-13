import { success, error } from "~~/server/utils/result";
import { ROLE_LEVEL } from "~~/utils/role";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY, type ConfigKey } from "~~/server/utils/config-keys";
import prisma from "~~/lib/prisma";

/**
 * 系统初始化前保存 R2 配置接口
 * 只有在系统未初始化时才能使用
 * 保存后刷新配置缓存，防止变更后未及时更新缓存导致错误
 */
export default defineEventHandler(async (event) => {
  try {
    // 检查系统是否已初始化
    const adminCount = await prisma.user.count({
      where: { role: ROLE_LEVEL.ADMIN },
    });

    if (adminCount > 0) {
      return error("系统已初始化，请使用管理接口配置");
    }

    const body = await readBody(event);
    const {
      r2Url,
      r2SecretId,
      r2SecretKey,
      r2Token,
      r2Bucket,
      r2Domain,
    } = body;

    // 验证必填字段
    if (!r2Url || !r2SecretId || !r2SecretKey || !r2Bucket) {
      return error("R2 URL、Access Key ID、Secret Access Key 和 Bucket 名称是必填项");
    }

    // 验证 R2_SECRET_ID 必须是 32 字符
    if (r2SecretId.trim().length !== 32) {
      return error("R2 Access Key ID 必须是 32 个字符");
    }

    // 构建配置对象（仅包含有元数据的键）
    const r2Configs: Partial<Record<ConfigKey, string | null>> = {};
    if (r2Url) r2Configs[CONFIG_KEY.R2_URL] = r2Url.trim();
    if (r2SecretId) r2Configs[CONFIG_KEY.R2_SECRET_ID] = r2SecretId.trim();
    if (r2SecretKey) r2Configs[CONFIG_KEY.R2_SECRET_KEY] = r2SecretKey.trim();
    if (r2Token) r2Configs[CONFIG_KEY.R2_TOKEN] = r2Token.trim();
    if (r2Bucket) r2Configs[CONFIG_KEY.R2_BUCKET] = r2Bucket.trim();
    if (r2Domain) r2Configs[CONFIG_KEY.R2_DOMAIN] = r2Domain.trim();

    const configsToSave = r2Configs as Record<ConfigKey, string | null>;
    if (Object.keys(configsToSave).length === 0) {
      return error("没有有效的 R2 配置项");
    }

    // 通过 configCache 批量写入（同时更新数据库与内存缓存）
    await configCache.setBatch(configsToSave);

    // 再次从数据库刷新缓存，确保与 DB 完全一致
    await configCache.refresh();

    return success(
      {
        saved: Object.keys(configsToSave),
      },
      "R2 配置保存成功"
    );
  } catch (err: any) {
    console.error("保存 R2 配置失败:", err);
    return error(err.message || "保存 R2 配置失败");
  }
});
