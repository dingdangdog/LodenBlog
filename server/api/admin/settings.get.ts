import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    // 获取第一个设置记录
    const setting = await prisma.setting.findFirst();

    if (!setting) {
      return success({
        title: "",
        description: "",
        keyword: "",
        domain: null,
        logo: "",
        logoLight: null,
        logoDark: null,
        icon: "",
        iconLight: null,
        iconDark: null,
        defaultLang: "zh",
        languageCode: null,
        i18nEnabled: false,
        primaryLanguage: null,
        targetLanguages: null,
        autoTranslateEnabled: false,
        primaryTranslationProvider: null,
        fallbackTranslationProvider: null,
        customHead: null,
        customCSS: null,
        customJS: null,
      });
    }

    return success({
      title: setting.title,
      description: setting.description,
      keyword: setting.keyword,
      domain: setting.domain,
      logo: setting.logo,
      logoLight: setting.logoLight,
      logoDark: setting.logoDark,
      icon: setting.icon,
      iconLight: setting.iconLight,
      iconDark: setting.iconDark,
      defaultLang: setting.defaultLang,
      languageCode: setting.languageCode,
      i18nEnabled: setting.i18nEnabled,
      primaryLanguage: setting.primaryLanguage,
      targetLanguages: setting.targetLanguages,
      autoTranslateEnabled: setting.autoTranslateEnabled,
      primaryTranslationProvider: setting.primaryTranslationProvider,
      fallbackTranslationProvider: setting.fallbackTranslationProvider,
      customHead: setting.customHead,
      customCSS: setting.customCSS,
      customJS: setting.customJS,
    });
  } catch (err: any) {
    return error(err.message || "获取设置失败");
  }
});
