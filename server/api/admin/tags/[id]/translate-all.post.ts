import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";
import { checkTranslationAvailability, getAvailableTranslationProviders } from "~~/server/utils/translater";
import { translateWithRetry } from "~~/server/translations";
import type { TranslationProviderConfig } from "~~/server/translations/types";

/**
 * 翻译标签到所有其他语言
 * POST /api/admin/tags/[id]/translate-all
 */
export default defineEventHandler(async (event) => {
  try {
    // 需要管理员权限
    await requireAdmin(event);
    const tagId = getRouterParam(event, "id");

    if (!tagId) {
      return error("标签 ID 不能为空");
    }

    // 检查标签是否存在
    const sourceTag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!sourceTag) {
      return error("标签不存在");
    }

    const body = await readBody(event);
    const { sourceLanguageCode, providerId, targetLanguageCodes } = body;

    if (!sourceLanguageCode) {
      return error("源语言代码不能为空");
    }

    // 验证源语言是否匹配
    if (sourceTag.languageCode !== sourceLanguageCode) {
      return error("源语言代码与标签语言不匹配");
    }

    // 验证目标语言代码（如果提供）
    let validTargetCodes: string[] | undefined;
    if (targetLanguageCodes && Array.isArray(targetLanguageCodes)) {
      if (targetLanguageCodes.length === 0) {
        return error("请至少选择一个目标语言");
      }
      // 过滤掉空值和源语言
      validTargetCodes = targetLanguageCodes.filter(
        (code: string) => code && code !== sourceLanguageCode
      );
      if (validTargetCodes.length === 0) {
        return error("目标语言不能包含源语言，请至少选择一个不同的目标语言");
      }
    }

    // 检查翻译可用性（系统设置和服务商配置）
    const availability = await checkTranslationAvailability();
    if (!availability.available) {
      return error(availability.reason || "翻译功能不可用");
    }

    // 确定目标语言列表
    let finalTargetCodes: string[];
    if (validTargetCodes && validTargetCodes.length > 0) {
      finalTargetCodes = validTargetCodes;
    } else {
      // 如果没有指定目标语言，翻译到所有其他语言
      const allLanguages = await prisma.language.findMany({
        where: {
          isActive: true,
          code: { not: sourceLanguageCode },
        },
      });
      finalTargetCodes = allLanguages.map((lang: any) => lang.code);
    }

    if (finalTargetCodes.length === 0) {
      return error("没有可用的目标语言");
    }

    // 获取可用的翻译服务商
    const providers = await getAvailableTranslationProviders(providerId);
    if (providers.length === 0) {
      return error("没有可用的翻译服务商，请先配置翻译服务商");
    }

    // 翻译结果
    const results: Array<{
      targetLanguageCode: string;
      success: boolean;
      message?: string;
    }> = [];

    // 对每个目标语言进行翻译
    for (const targetCode of finalTargetCodes) {
      try {
        // 将 provider 转换为 TranslationProviderConfig 格式
        const provider = providers[0]; // 使用第一个可用的服务商
        const config: TranslationProviderConfig = {
          id: provider.id,
          name: provider.name,
          provider: provider.provider,
          apiKey: provider.apiKey,
          apiSecret: provider.apiSecret,
          apiEndpoint: provider.apiEndpoint,
          timeout: provider.timeout,
          maxRetries: provider.maxRetries,
          priority: provider.priority,
          extraConfig: provider.extraConfig,
          isActive: provider.isActive,
        };

        // 翻译标签名称
        const translatedName = await translateWithRetry(
          sourceTag.name,
          sourceLanguageCode,
          targetCode,
          config
        );

        if (!translatedName || !translatedName.trim()) {
          results.push({
            targetLanguageCode: targetCode,
            success: false,
            message: "翻译结果为空",
          });
          continue;
        }

        // 检查目标语言下是否存在相同slug的标签
        const existingTag = await prisma.tag.findUnique({
          where: {
            slug_languageCode: {
              slug: sourceTag.slug,
              languageCode: targetCode,
            },
          },
        });

        if (existingTag) {
          // 如果存在，更新name字段
          await prisma.tag.update({
            where: { id: existingTag.id },
            data: { name: translatedName.trim() },
          });
          results.push({
            targetLanguageCode: targetCode,
            success: true,
            message: "已更新现有标签",
          });
        } else {
          // 如果不存在，创建新标签
          await prisma.tag.create({
            data: {
              slug: sourceTag.slug,
              name: translatedName.trim(),
              color: sourceTag.color, // 保持相同的颜色
              languageCode: targetCode,
            },
          });
          results.push({
            targetLanguageCode: targetCode,
            success: true,
            message: "已创建新标签",
          });
        }
      } catch (err: any) {
        console.error(`翻译标签到 ${targetCode} 失败:`, err);
        results.push({
          targetLanguageCode: targetCode,
          success: false,
          message: err.message || "翻译失败",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return success({
      totalTargetLanguages: finalTargetCodes.length,
      successCount,
      failureCount,
      results,
    });
  } catch (err: any) {
    console.error("翻译标签失败:", err);
    return error(err.message || "翻译标签失败");
  }
});
