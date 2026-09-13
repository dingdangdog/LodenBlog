/**
 * 获取用于 AI 调用的服务商配置（单条）
 * 只查询 AiConfig，供主题生成/优化、文章生成等接口复用
 */
import prisma from "~~/lib/prisma";
import type { TranslationProviderConfig } from "~~/server/translations/types";
import { dbRowToConfig, isUsableProvider } from "~~/server/utils/provider-config";

/**
 * 获取可用于 AI 调用的服务商配置
 * @param providerId 若传入，则只返回该 ID 的配置（需存在、启用、已配置 apiKey）
 * @returns 单条配置，若无可用配置返回 null
 */
export async function getProviderConfigForAI(
  providerId?: string | null
): Promise<TranslationProviderConfig | null> {
  if (providerId) {
    const config = await prisma.aiConfig.findUnique({
      where: { id: providerId },
    });
    if (!isUsableProvider(config)) {
      return null;
    }
    return dbRowToConfig(config!);
  }

  const setting = await prisma.setting.findFirst({
    where: {},
    orderBy: { createdAt: "asc" },
  });

  if (setting?.primaryTranslationProvider) {
    const config = await prisma.aiConfig.findUnique({
      where: { id: setting.primaryTranslationProvider },
    });
    if (isUsableProvider(config)) {
      return dbRowToConfig(config!);
    }
  }

  const candidates = await prisma.aiConfig.findMany({
    where: { isActive: true },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
  const fallbackAi = candidates.find((row) => isUsableProvider(row));
  if (fallbackAi) {
    return dbRowToConfig(fallbackAi);
  }

  return null;
}
