import { success } from "~~/server/utils/result";
import { configCache } from "~~/server/utils/config-cache";
import { CONFIG_KEY } from "~~/server/utils/config-keys";

/**
 * 获取 OAuth 登录开关（公共接口，供登录/注册页隐藏按钮）
 */
export default defineEventHandler(async () => {
  try {
    if (!configCache.isInitialized()) {
      await configCache.initialize();
    }
    return success({
      googleLoginEnabled: configCache.getBoolean(CONFIG_KEY.GOOGLE_LOGIN_ENABLED),
      githubLoginEnabled: configCache.getBoolean(CONFIG_KEY.GITHUB_LOGIN_ENABLED),
    });
  } catch {
    return success({
      googleLoginEnabled: true,
      githubLoginEnabled: true,
    });
  }
});
