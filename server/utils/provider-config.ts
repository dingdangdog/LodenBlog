import prisma from "~~/lib/prisma";
import type { TranslationProviderConfig } from "~~/server/translations/types";

export type ProviderSource = "ai" | "translation";

export function dbRowToConfig(row: {
  id: string;
  name: string;
  provider: string;
  apiKey: string | null;
  apiSecret: string | null;
  apiEndpoint: string | null;
  timeout: number | null;
  maxRetries: number | null;
  priority: number | null;
  extraConfig: string | null;
  isActive: boolean;
}): TranslationProviderConfig {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    apiKey: row.apiKey,
    apiSecret: row.apiSecret,
    apiEndpoint: row.apiEndpoint,
    timeout: row.timeout ?? 30000,
    maxRetries: row.maxRetries ?? 3,
    priority: row.priority ?? 0,
    extraConfig: row.extraConfig,
    isActive: row.isActive,
  };
}

export function isUsableProvider(
  row: { isActive: boolean; apiKey: string | null } | null | undefined
): boolean {
  return !!row && row.isActive && !!row.apiKey;
}

export async function findProviderById(id: string) {
  const ai = await prisma.aiConfig.findUnique({ where: { id } });
  if (ai) {
    return { row: ai, source: "ai" as const };
  }
  const translation = await prisma.translationConfig.findUnique({
    where: { id },
  });
  if (translation) {
    return { row: translation, source: "translation" as const };
  }
  return null;
}

export async function findUsableProviderById(id: string) {
  const found = await findProviderById(id);
  if (!found || !isUsableProvider(found.row)) {
    return null;
  }
  return found;
}
