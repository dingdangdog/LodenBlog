import en from "./locales/en";
import zh from "./locales/zh";
import ja from "./locales/ja";
import es from "./locales/es";
import de from "./locales/de";

export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: "zh",
    messages: {
      zh,
      en,
      ja,
      es,
      de,
    },
    // 开发环境也启用严格模式，及早发现问题
    warnHtmlInMessage: "off",
    // 缺失翻译时的处理
    missingWarn: process.env.NODE_ENV === "development",
    fallbackWarn: process.env.NODE_ENV === "development",
    // 错误处理：开发环境显示警告，生产环境静默失败
    missing: process.env.NODE_ENV === "development" 
      ? (locale: string, key: string, vm: any, values: any) => {
          console.warn(`[i18n] Missing translation: ${locale}.${key}`);
          return key;
        }
      : undefined,
  };
});
