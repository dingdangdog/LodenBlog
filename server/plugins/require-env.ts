/**
 * 运行时校验必需密钥。构建阶段不执行，避免 CI 无密钥时失败。
 */
export default defineNitroPlugin(() => {
  if (import.meta.prerender) {
    return;
  }

  const missing = ["NUXT_AUTH_SECRET", "NUXT_SALT"].filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
});
