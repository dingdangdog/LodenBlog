import { success, error } from "~~/server/utils/result";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY } from "~~/server/utils/config-keys";

/**
 * 获取 Google Analytics ID（公共接口，无需权限）
 */
export default defineEventHandler(async (event) => {
  try {
    // 确保配置缓存已初始化
    if (!configCache.isInitialized()) {
      await configCache.initialize();
    }

    // 获取 Google Analytics ID
    const gaId = configCache.get(CONFIG_KEY.GOOGLE_ANALYTICS_ID);
    // console.log("Google Analytics ID:", gaId);
    return success({
      id: gaId || null,
      enabled: !!gaId, // 如果 ID 存在且不为空，则启用
    });
  } catch (err: any) {
    console.error(err);
    // 静默失败，返回未启用状态
    return success({
      id: null,
      enabled: false,
    });
  }
});
