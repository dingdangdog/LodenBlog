import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const language = query.language as string;

    let where: any = {};

    // 如果提供了语言代码，直接使用
    if (language) {
      where.languageCode = language;
    } else {
      // 如果没有提供语言，获取默认语言的设置
      const defaultLang = await prisma.language.findFirst({
        where: { isDefault: true },
      });
      if (defaultLang) {
        where.languageCode = defaultLang.code;
      }
    }

    // 查找设置，如果没有找到对应语言的，则查找没有languageCode的全局设置
    let setting = await prisma.setting.findFirst({
      where: where.languageCode ? where : {},
      orderBy: { updatedAt: "desc" },
    });

    // 如果没找到，尝试找全局设置（languageCode为null）
    if (!setting) {
      setting = await prisma.setting.findFirst({
        where: { languageCode: null },
        orderBy: { updatedAt: "desc" },
      });
    }

    // 如果还是没找到，返回默认值
    if (!setting) {
      return success({
        title: "Loden",
        description: "",
        keyword: "",
        logo: "",
        logoLight: null,
        logoDark: null,
        icon: "",
        iconLight: null,
        iconDark: null,
        defaultLang: "zh",
        customHead: null,
        customCSS: null,
        customJS: null,
      });
    }

    return success({
      title: setting.title,
      description: setting.description,
      keyword: setting.keyword,
      logo: setting.logo,
      logoLight: setting.logoLight,
      logoDark: setting.logoDark,
      icon: setting.icon,
      iconLight: setting.iconLight,
      iconDark: setting.iconDark,
      defaultLang: setting.defaultLang,
      customHead: setting.customHead,
      customCSS: setting.customCSS,
      customJS: setting.customJS,
    });
  } catch (err: any) {
    return error(err.message || "获取设置失败");
  }
});
