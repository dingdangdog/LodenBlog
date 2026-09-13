/**
 * 翻译服务商配置接口
 */
export interface TranslationProviderConfig {
  id: string;
  name: string;
  provider: string;
  apiKey: string | null;
  apiSecret: string | null;
  apiEndpoint: string | null;
  timeout: number;
  maxRetries: number;
  priority: number;
  extraConfig: string | null; // JSON格式的额外配置
  isActive: boolean;
}

/**
 * 翻译选项
 */
export interface TranslationOptions {
  /**
   * 内容类型：'title' 表示标题（使用简化提示词），'content' 表示正文（使用完整Markdown提示词）
   */
  contentType?: "title" | "content";
}

/**
 * 扩展的翻译服务商配置（包含临时选项）
 */
export interface ExtendedTranslationProviderConfig extends TranslationProviderConfig {
  /**
   * 翻译选项（临时属性，不会持久化到数据库）
   */
  _translationOptions?: TranslationOptions;
}

/**
 * 翻译服务商客户端接口
 */
export interface TranslationClient {
  /**
   * 翻译文本
   * @param text 要翻译的文本
   * @param from 源语言代码（如 "zh", "en", "ja"）
   * @param to 目标语言代码（如 "zh", "en", "ja"）
   * @param config 服务商配置（可能包含临时选项）
   * @returns 翻译后的文本
   */
  translate(
    text: string,
    from: string,
    to: string,
    config: ExtendedTranslationProviderConfig
  ): Promise<string>;
}

/**
 * 语言代码映射
 * 将标准语言代码（如 "zh", "en", "ja"）转换为各服务商支持的语言代码
 */
export const LanguageCodeMap: Record<
  string,
  Record<string, string>
> = {
  // OpenAI 使用标准 ISO 639-1 代码
  openai: {
    zh: "zh",
    en: "en",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    pt: "pt",
    ru: "ru",
    ar: "ar",
  },
  // DeepL 语言代码
  deepl: {
    zh: "ZH",
    en: "EN",
    ja: "JA",
    ko: "KO",
    fr: "FR",
    de: "DE",
    es: "ES",
    it: "IT",
    pt: "PT",
    ru: "RU",
    ar: "AR",
  },
  // 火山方舟语言代码
  volcano: {
    zh: "zh",
    en: "en",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    pt: "pt",
    ru: "ru",
    ar: "ar",
  },
  // Google Translate 语言代码
  google: {
    zh: "zh-CN",
    en: "en",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    pt: "pt",
    ru: "ru",
    ar: "ar",
  },
  // 百度翻译语言代码
  baidu: {
    zh: "zh",
    en: "en",
    ja: "jp",
    ko: "kor",
    fr: "fra",
    de: "de",
    es: "spa",
    it: "it",
    pt: "pt",
    ru: "ru",
    ar: "ara",
  },
  // 腾讯翻译语言代码
  tencent: {
    zh: "zh",
    en: "en",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    pt: "pt",
    ru: "ru",
    ar: "ar",
  },
  // 有道翻译语言代码
  youdao: {
    zh: "zh-CHS",
    en: "en",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    pt: "pt",
    ru: "ru",
    ar: "ar",
  },
  // Google Gemini 使用标准 ISO 639-1 代码
  gemini: {
    zh: "zh",
    en: "en",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    pt: "pt",
    ru: "ru",
    ar: "ar",
  },
  // DeepSeek 使用标准 ISO 639-1 代码（与 OpenAI 兼容）
  deepseek: {
    zh: "zh",
    en: "en",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    pt: "pt",
    ru: "ru",
    ar: "ar",
  },
};

/**
 * 获取服务商对应的语言代码
 */
export function getProviderLanguageCode(
  provider: string,
  standardCode: string
): string {
  const map = LanguageCodeMap[provider] || LanguageCodeMap.openai;
  return map[standardCode] || standardCode;
}
