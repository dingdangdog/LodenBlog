import { setResponseHeader } from "h3";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY } from "~~/server/utils/config-keys";

/** 从原始 ID 字符串清洗出纯数字（去掉 ca-pub- / pub- 前缀），与前端逻辑一致 */
function normalizeAdsId(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const numeric = trimmed.replace(/^(?:ca-pub-|pub-)/i, "");
  return /^\d+$/.test(numeric) ? numeric : null;
}

/**
 * 动态返回 ads.txt 内容，基于系统配置中的 GOOGLE_ADS_ID
 * 格式：google.com, pub-{numericId}, DIRECT, f08c47fec0942fa0
 */
export default defineEventHandler(async (event) => {
  if (!configCache.isInitialized()) {
    await configCache.initialize();
  }

  const rawId = configCache.get(CONFIG_KEY.GOOGLE_ADS_ID);
  const numericId = normalizeAdsId(rawId);

  const body = numericId
    ? `google.com, pub-${numericId}, DIRECT, f08c47fec0942fa0`
    : "# No ads.txt publisher configured";

  setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setResponseHeader(event, "Cache-Control", "public, max-age=3600");
  setResponseHeader(event, "Content-Disposition", 'inline; filename="ads.txt"');

  return body;
});
