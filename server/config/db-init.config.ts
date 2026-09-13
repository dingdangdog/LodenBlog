/**
 * 数据库初始化配置
 * 控制服务器启动时自动初始化哪些数据
 */
export const dbInitConfig = {
  // 是否启用自动初始化
  enabled: true,

  // 初始化语言数据
  languages: {
    enabled: true,
    data: [
      {
        code: "zh",
        name: "Chinese",
        nativeName: "中文",
        isActive: true,
        isDefault: true,
        sortOrder: 1,
      },
      {
        code: "en",
        name: "English",
        nativeName: "English",
        isActive: true,
        isDefault: false,
        sortOrder: 2,
      },
      {
        code: "ja",
        name: "Japanese",
        nativeName: "日本語",
        isActive: true,
        isDefault: false,
        sortOrder: 3,
      },
    ],
  },

  // 初始化主题数据
  themes: {
    enabled: true,
    // 主题数据在 init-db.ts 中定义
  },

  // 初始化分类数据
  categories: {
    enabled: true,
    templates: [
      {
        slug: "uncategorized",
        names: {
          zh: "未分类",
          en: "Uncategorized",
          ja: "未分類",
        },
        descriptions: {
          zh: "默认分类",
          en: "Default category",
          ja: "デフォルトカテゴリ",
        },
        sortOrder: 0,
      },
      {
        slug: "technology",
        names: {
          zh: "技术",
          en: "Technology",
          ja: "テクノロジー",
        },
        descriptions: {
          zh: "技术相关文章",
          en: "Technology related articles",
          ja: "技術関連の記事",
        },
        sortOrder: 1,
      },
      {
        slug: "lifestyle",
        names: {
          zh: "生活",
          en: "Lifestyle",
          ja: "ライフスタイル",
        },
        descriptions: {
          zh: "生活方式相关文章",
          en: "Lifestyle related articles",
          ja: "ライフスタイル関連の記事",
        },
        sortOrder: 2,
      },
      {
        slug: "travel",
        names: {
          zh: "旅行",
          en: "Travel",
          ja: "旅行",
        },
        descriptions: {
          zh: "旅行和探险",
          en: "Travel and adventure",
          ja: "旅行と冒険",
        },
        sortOrder: 3,
      },
    ],
  },

  // 初始化标签数据
  tags: {
    enabled: false, // 默认不启用，可按需开启
    templates: [
      {
        slug: "tutorial",
        names: {
          zh: "教程",
          en: "Tutorial",
          ja: "チュートリアル",
        },
      },
      {
        slug: "news",
        names: {
          zh: "新闻",
          en: "News",
          ja: "ニュース",
        },
      },
      {
        slug: "note",
        names: {
          zh: "笔记",
          en: "Note",
          ja: "ノート",
        },
      },
    ],
  },

  // 初始化 AI 服务商配置
  aiProviders: {
    enabled: true,
    providers: [
      {
        name: "OpenAI GPT-4",
        provider: "openai",
        timeout: 60000,
        maxRetries: 3,
        priority: 10,
        isActive: false,
        extraConfig: JSON.stringify({
          model: "gpt-4",
          temperature: 0.3,
          maxTokens: 4000,
        }),
      },
      {
        name: "Gemini AI",
        provider: "gemini",
        timeout: 60000,
        maxRetries: 3,
        priority: 10,
        isActive: false,
        extraConfig: JSON.stringify({
          model: "gemini-2.5-flash",
          temperature: 0.3,
          maxTokens: 4000,
        }),
      },
      {
        name: "Alibaba AI",
        provider: "alibaba",
        timeout: 60000,
        maxRetries: 3,
        priority: 10,
        isActive: false,
        extraConfig: JSON.stringify({
          model: "qw-cloud-translate-v1",
          temperature: 0.3,
          maxTokens: 4000,
        }),
      },
      {
        name: "DeepSeek",
        provider: "deepseek",
        timeout: 60000,
        maxRetries: 3,
        priority: 10,
        isActive: false,
        extraConfig: JSON.stringify({
          model: "deepseek-chat",
          temperature: 0.3,
          maxTokens: 4000,
        }),
      },
    ],
  },

  // 初始化机器翻译服务商配置
  translationProviders: {
    enabled: true,
    providers: [
      {
        name: "DeepL Pro",
        provider: "deepl",
        timeout: 30000, // 30秒
        maxRetries: 3,
        priority: 9,
        isActive: false,
        extraConfig: JSON.stringify({
          formality: "default", // default, more, less
        }),
      },
      {
        name: "火山方舟",
        provider: "volcano",
        timeout: 30000,
        maxRetries: 3,
        priority: 7,
        isActive: false,
        extraConfig: JSON.stringify({
          version: "v1",
        }),
      },
      {
        name: "Google Translate",
        provider: "google",
        timeout: 30000,
        maxRetries: 3,
        priority: 6,
        isActive: false,
        extraConfig: JSON.stringify({
          format: "text",
        }),
      },
      {
        name: "百度翻译",
        provider: "baidu",
        timeout: 30000,
        maxRetries: 3,
        priority: 5,
        isActive: false,
        extraConfig: JSON.stringify({
          domain: "general",
        }),
      },
      {
        name: "腾讯翻译",
        provider: "tencent",
        timeout: 30000,
        maxRetries: 3,
        priority: 4,
        isActive: false,
        extraConfig: JSON.stringify({
          projectId: "",
        }),
      },
      {
        name: "有道翻译",
        provider: "youdao",
        timeout: 30000,
        maxRetries: 3,
        priority: 3,
        isActive: false,
        extraConfig: JSON.stringify({
          version: "v1",
        }),
      },
    ],
  },
};
