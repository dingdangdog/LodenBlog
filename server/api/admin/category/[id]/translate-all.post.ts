import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAdmin } from "~~/server/utils/permission";
import { checkTranslationAvailability, getAvailableTranslationProviders } from "~~/server/utils/translater";
import { translateWithRetry } from "~~/server/translations";
import type { TranslationProviderConfig } from "~~/server/translations/types";

/**
 * 翻译分类到所有其他语言
 * POST /api/admin/category/[id]/translate-all
 */
export default defineEventHandler(async (event) => {
  try {
    // 需要管理员权限
    await requireAdmin(event);
    const categoryId = getRouterParam(event, "id");

    if (!categoryId) {
      return error("分类 ID 不能为空");
    }

    // 检查分类是否存在
    const sourceCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!sourceCategory) {
      return error("分类不存在");
    }

    const body = await readBody(event);
    const { sourceLanguageCode, providerId, targetLanguageCodes } = body;

    if (!sourceLanguageCode) {
      return error("源语言代码不能为空");
    }

    // 验证源语言是否匹配
    if (sourceCategory.languageCode !== sourceLanguageCode) {
      return error("源语言代码与分类语言不匹配");
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

        // 翻译分类名称
        const translatedName = await translateWithRetry(
          sourceCategory.name,
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

        // 翻译描述（如果有）
        let translatedDescription: string | null = null;
        if (sourceCategory.description) {
          try {
            translatedDescription = await translateWithRetry(
              sourceCategory.description,
              sourceLanguageCode,
              targetCode,
              config
            );
            if (!translatedDescription || !translatedDescription.trim()) {
              translatedDescription = null;
            }
          } catch (err) {
            // 描述翻译失败不影响整体流程
            console.warn(`翻译分类描述到 ${targetCode} 失败:`, err);
            translatedDescription = null;
          }
        }

        // 检查目标语言下是否存在相同slug的分类
        const existingCategory = await prisma.category.findUnique({
          where: {
            slug_languageCode: {
              slug: sourceCategory.slug,
              languageCode: targetCode,
            },
          },
        });

        if (existingCategory) {
          // 如果存在，更新name字段（和description）
          await prisma.category.update({
            where: { id: existingCategory.id },
            data: {
              name: translatedName.trim(),
              description: translatedDescription,
            },
          });
          results.push({
            targetLanguageCode: targetCode,
            success: true,
            message: "已更新现有分类",
          });
        } else {
          // 如果不存在，创建新分类
          // 注意：parentId 需要特殊处理，因为不同语言的父分类ID不同
          // 这里暂时不处理parentId，保持为null，用户可以在编辑时手动设置
          await prisma.category.create({
            data: {
              slug: sourceCategory.slug,
              name: translatedName.trim(),
              description: translatedDescription,
              color: sourceCategory.color, // 保持相同的颜色
              icon: sourceCategory.icon, // 保持相同的图标
              sortOrder: sourceCategory.sortOrder, // 保持相同的排序
              isActive: sourceCategory.isActive, // 保持相同的状态
              languageCode: targetCode,
              parentId: null, // 父分类需要手动设置，因为不同语言的父分类ID不同
            },
          });
          results.push({
            targetLanguageCode: targetCode,
            success: true,
            message: "已创建新分类",
          });
        }
      } catch (err: any) {
        console.error(`翻译分类到 ${targetCode} 失败:`, err);
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
    console.error("翻译分类失败:", err);
    return error(err.message || "翻译分类失败");
  }
});
