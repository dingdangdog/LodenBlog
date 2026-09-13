/**
 * 服务商分类：机器翻译 vs AI
 * TranslationConfig 只存机器翻译；其余一律视为 AI（含 OpenAI 兼容自定义协议）
 */
export const MACHINE_TRANSLATION_PROVIDERS = [
  "deepl",
  "volcano",
  "google",
  "baidu",
  "tencent",
  "youdao",
] as const;

export type MachineTranslationProvider =
  (typeof MACHINE_TRANSLATION_PROVIDERS)[number];

export function isMachineTranslationProvider(provider: string | null | undefined): boolean {
  if (!provider) return false;
  return (MACHINE_TRANSLATION_PROVIDERS as readonly string[]).includes(
    provider.trim().toLowerCase()
  );
}

export function isAiProvider(provider: string | null | undefined): boolean {
  return !isMachineTranslationProvider(provider);
}
