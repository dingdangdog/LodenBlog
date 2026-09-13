import { success } from "~~/server/utils/result";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY } from "~~/server/utils/config-keys";

/**
 * 获取 Google Ads 配置（公共接口，无需权限）
 * enabled：总开关打开且已配置 ID；articleAdsEnabled：文内广告开关打开且已配置 Slot
 */
export default defineEventHandler(async () => {
  try {
    if (!configCache.isInitialized()) {
      await configCache.initialize();
    }

    const adsId = configCache.get(CONFIG_KEY.GOOGLE_ADS_ID);
    const adsSlot = configCache.get(CONFIG_KEY.GOOGLE_ADS_ARTICLE_ADS_SLOT);
    const adsMasterEnabled = configCache.getBoolean(CONFIG_KEY.GOOGLE_ADS_ENABLED);
    const articleAdsSwitchEnabled = configCache.getBoolean(
      CONFIG_KEY.GOOGLE_ADS_ARTICLE_ADS_ENABLED
    );

    const hasId = !!adsId?.trim();
    const hasSlot = !!adsSlot?.trim();
    return success({
      id: adsId?.trim() || null,
      slot: adsSlot?.trim() || null,
      enabled: hasId && adsMasterEnabled,
      articleAdsEnabled: hasId && hasSlot && adsMasterEnabled && articleAdsSwitchEnabled,
    });
  } catch (err: any) {
    console.error(err);
    return success({
      id: null,
      slot: null,
      enabled: false,
      articleAdsEnabled: false,
    });
  }
});
