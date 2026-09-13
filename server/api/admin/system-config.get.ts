import { success, error } from "~~/server/utils/result";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY, CONFIG_METADATA } from "~~/server/utils/config-keys";
import { requireAdmin } from "~~/server/utils/permission";

/**
 * 获取系统配置
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    // 确保配置缓存已初始化
    if (!configCache.isInitialized()) {
      await configCache.initialize();
    }

    // 获取所有配置
    const allConfigs = configCache.getAll();

    // 按分类组织配置
    const configsByCategory: Record<string, any[]> = {};

    for (const [key, value] of Object.entries(allConfigs)) {
      const metadata = CONFIG_METADATA[key as keyof typeof CONFIG_METADATA];
      if (!metadata) continue;

      const category = metadata.category || "other";
      if (!configsByCategory[category]) {
        configsByCategory[category] = [];
      }

      configsByCategory[category].push({
        key,
        value,
        description: metadata.description,
        isEncrypted: metadata.isEncrypted,
        isRequired: metadata.isRequired || false,
      });
    }

    return success({
      configs: allConfigs,
      configsByCategory,
      metadata: CONFIG_METADATA,
    });
  } catch (err: any) {
    return error(err.message || "获取系统配置失败");
  }
});
