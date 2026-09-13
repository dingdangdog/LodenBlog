import { success, error } from "~~/server/utils/result";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY } from "~~/server/utils/config-keys";

/**
 * 获取 R2 域名（公共接口，无需权限）
 */
export default defineEventHandler(async (event) => {
  try {
    // 确保配置缓存已初始化
    if (!configCache.isInitialized()) {
      await configCache.initialize();
    }

    // 获取 R2 域名
    const domain = configCache.get(CONFIG_KEY.R2_DOMAIN);
    return success({
      domain: domain || null,
    });
  } catch (err: any) {
    console.error(err);
    // 静默失败，返回 null
    return success({
      domain: null,
    });
  }
});
