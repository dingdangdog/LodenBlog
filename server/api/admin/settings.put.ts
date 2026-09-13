import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      title,
      description,
      keyword,
      domain,
      logo,
      logoLight,
      logoDark,
      icon,
      iconLight,
      iconDark,
      defaultLang,
      languageCode,
      i18nEnabled,
      primaryLanguage,
      targetLanguages,
      autoTranslateEnabled,
      primaryTranslationProvider,
      fallbackTranslationProvider,
      customHead,
      customCSS,
      customJS,
    } = body;

    // 获取第一个设置记录
    const setting = await prisma.setting.findFirst();

    if (!setting) {
      return error("系统未初始化");
    }

    const normalizeId = (value: unknown) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
      }
      return value as string | null;
    };

    const primaryId = normalizeId(primaryTranslationProvider);
    const fallbackId = normalizeId(fallbackTranslationProvider);

    if (primaryId) {
      const ai = await prisma.aiConfig.findUnique({
        where: { id: primaryId },
      });
      if (!ai || !ai.isActive) {
        return error("AI翻译服务商不存在或未启用");
      }
    }

    if (fallbackId) {
      const machine = await prisma.translationConfig.findUnique({
        where: { id: fallbackId },
      });
      if (!machine || !machine.isActive) {
        return error("机器翻译服务商不存在或未启用");
      }
    }

    // 更新设置
    const updated = await prisma.setting.update({
      where: { id: setting.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(keyword !== undefined && { keyword }),
        ...(domain !== undefined && { domain }),
        ...(logo !== undefined && { logo }),
        ...(logoLight !== undefined && { logoLight }),
        ...(logoDark !== undefined && { logoDark }),
        ...(icon !== undefined && { icon }),
        ...(iconLight !== undefined && { iconLight }),
        ...(iconDark !== undefined && { iconDark }),
        ...(defaultLang !== undefined && { defaultLang }),
        ...(languageCode !== undefined && { languageCode }),
        ...(i18nEnabled !== undefined && { i18nEnabled }),
        ...(primaryLanguage !== undefined && { primaryLanguage }),
        ...(targetLanguages !== undefined && { targetLanguages }),
        ...(autoTranslateEnabled !== undefined && { autoTranslateEnabled }),
        ...(primaryTranslationProvider !== undefined && {
          primaryTranslationProvider: primaryId,
        }),
        ...(fallbackTranslationProvider !== undefined && {
          fallbackTranslationProvider: fallbackId,
        }),
        ...(customHead !== undefined && { customHead }),
        ...(customCSS !== undefined && { customCSS }),
        ...(customJS !== undefined && { customJS }),
      },
    });

    return success({ setting: updated }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新设置失败");
  }
});
