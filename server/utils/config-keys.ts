/**
 * 系统配置键枚举
 * 所有配置键都在此定义，确保代码中使用的 key 与数据库中的 key 一致
 * 
 * 约定：
 * 1. 使用大写字母和下划线命名（如 R2_URL）
 * 2. 按分类组织，使用注释分隔
 * 3. 添加配置说明，便于理解用途
 */

// ==================== Cloudflare R2 配置 ====================
export const CONFIG_KEY = {
  // R2 基础配置
  R2_URL: "R2_URL", // R2 endpoint URL
  R2_SECRET_ID: "R2_SECRET_ID", // R2 Access Key ID (32字符)
  R2_SECRET_KEY: "R2_SECRET_KEY", // R2 Secret Access Key
  R2_TOKEN: "R2_TOKEN", // R2 HTTP API Token (可选)
  R2_BUCKET: "R2_BUCKET", // R2 Bucket 名称
  R2_DOMAIN: "R2_DOMAIN", // R2 公共访问域名

  // Google 服务配置
  GOOGLE_ADS_ID: "GOOGLE_ADS_ID", // Google Ads ID
  GOOGLE_ADS_ARTICLE_ADS_SLOT: "GOOGLE_ADS_ARTICLE_ADS_SLOT", // 文内广告位 .article-ads 对应 Slot ID
  GOOGLE_ANALYTICS_ID: "GOOGLE_ANALYTICS_ID", // Google Analytics ID

  // OAuth 登录开关（前端显示与后端回调校验）
  GOOGLE_LOGIN_ENABLED: "GOOGLE_LOGIN_ENABLED", // 是否启用 Google 登录
  GITHUB_LOGIN_ENABLED: "GITHUB_LOGIN_ENABLED", // 是否启用 GitHub 登录

  // Google 广告开关
  GOOGLE_ADS_ENABLED: "GOOGLE_ADS_ENABLED", // Google 广告总开关
  GOOGLE_ADS_ARTICLE_ADS_ENABLED: "GOOGLE_ADS_ARTICLE_ADS_ENABLED", // 文内广告开关

  // 其他配置（预留）
  // 可以继续添加更多配置键...
} as const;

/**
 * 配置键类型
 */
export type ConfigKey = typeof CONFIG_KEY[keyof typeof CONFIG_KEY];

/**
 * 配置分类
 */
export const CONFIG_CATEGORY = {
  R2: "r2",
  GOOGLE: "google",
  OAUTH: "oauth",
  OTHER: "other",
} as const;

/**
 * 配置键的元数据（用于管理界面显示和验证）
 */
export const CONFIG_METADATA: Record<
  ConfigKey,
  {
    description: string;
    category: string;
    isEncrypted: boolean;
    isRequired?: boolean;
  }
> = {
  [CONFIG_KEY.R2_URL]: {
    description: "Cloudflare R2 Endpoint URL",
    category: CONFIG_CATEGORY.R2,
    isEncrypted: false,
    isRequired: true,
  },
  [CONFIG_KEY.R2_SECRET_ID]: {
    description: "Cloudflare R2 Access Key ID (32字符)",
    category: CONFIG_CATEGORY.R2,
    isEncrypted: true,
    isRequired: true,
  },
  [CONFIG_KEY.R2_SECRET_KEY]: {
    description: "Cloudflare R2 Secret Access Key",
    category: CONFIG_CATEGORY.R2,
    isEncrypted: true,
    isRequired: true,
  },
  [CONFIG_KEY.R2_TOKEN]: {
    description: "Cloudflare R2 HTTP API Token (可选)",
    category: CONFIG_CATEGORY.R2,
    isEncrypted: true,
    isRequired: false,
  },
  [CONFIG_KEY.R2_BUCKET]: {
    description: "Cloudflare R2 Bucket 名称",
    category: CONFIG_CATEGORY.R2,
    isEncrypted: false,
    isRequired: true,
  },
  [CONFIG_KEY.R2_DOMAIN]: {
    description: "Cloudflare R2 公共访问域名",
    category: CONFIG_CATEGORY.R2,
    isEncrypted: false,
    isRequired: false,
  },
  [CONFIG_KEY.GOOGLE_ADS_ID]: {
    description: "Google AdSense Publisher ID (digits only, e.g. 1234567890123456)",
    category: CONFIG_CATEGORY.GOOGLE,
    isEncrypted: false,
    isRequired: false,
  },
  [CONFIG_KEY.GOOGLE_ADS_ARTICLE_ADS_SLOT]: {
    description: "Google AdSense Slot ID（only for .article-ads placeholder）",
    category: CONFIG_CATEGORY.GOOGLE,
    isEncrypted: false,
    isRequired: false,
  },
  [CONFIG_KEY.GOOGLE_ANALYTICS_ID]: {
    description: "Google Analytics ID",
    category: CONFIG_CATEGORY.GOOGLE,
    isEncrypted: false,
    isRequired: false,
  },
  [CONFIG_KEY.GOOGLE_LOGIN_ENABLED]: {
    description: "启用 Google 登录（true/false）",
    category: CONFIG_CATEGORY.OAUTH,
    isEncrypted: false,
    isRequired: false,
  },
  [CONFIG_KEY.GITHUB_LOGIN_ENABLED]: {
    description: "启用 GitHub 登录（true/false）",
    category: CONFIG_CATEGORY.OAUTH,
    isEncrypted: false,
    isRequired: false,
  },
  [CONFIG_KEY.GOOGLE_ADS_ENABLED]: {
    description: "Google 广告总开关（true/false）",
    category: CONFIG_CATEGORY.GOOGLE,
    isEncrypted: false,
    isRequired: false,
  },
  [CONFIG_KEY.GOOGLE_ADS_ARTICLE_ADS_ENABLED]: {
    description: "Google 文内广告开关（true/false）",
    category: CONFIG_CATEGORY.GOOGLE,
    isEncrypted: false,
    isRequired: false,
  },
};
