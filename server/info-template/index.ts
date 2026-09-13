import type { InfoKey } from "./types";
import { termsTemplate } from "./terms";
import { privacyTemplate } from "./privacy";
import { aboutTemplate } from "./about";

const TEMPLATES: Record<InfoKey, Record<string, import("./types").InfoBlock>> = {
  terms: termsTemplate,
  privacy: privacyTemplate,
  about: aboutTemplate,
};

/** 默认 slug 带 .html 后缀，用于伪装原生 html 页面 */
const INFO_SLUGS: string[] = ["terms.html", "privacy.html", "about.html"];

/** 已下线的信息页 slug，存量库启动时删除，公开接口不再返回 */
const RETIRED_INFO_SLUGS = ["thanks.html", "thanks"];

function replacePlaceholders(text: string, siteName: string, domain?: string): string {
  let out = text.replace(/\bLoden\b/g, siteName);
  // 域名替换：若传入 domain 则替换模板中的 example.com，否则保留原文
  if (domain) {
    const domainNorm = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    out = out.replace(/example\.com/g, domainNorm);
  }
  return out;
}

/** 根据语言、信息类型、站点名称和可选域名生成标题和正文 */
export function buildInfoContent(
  languageCode: string,
  key: InfoKey,
  siteName: string,
  domain?: string
): { title: string; content: string } {
  const byLang = TEMPLATES[key];
  const block = byLang[languageCode] ?? byLang.en;
  if (!block) throw new Error(`Unknown info key: ${key}`);
  return {
    title: replacePlaceholders(block.title, siteName, domain),
    content: replacePlaceholders(block.content, siteName, domain),
  };
}

export function getInfoSlugs(): string[] {
  return [...INFO_SLUGS];
}

export function getRetiredInfoSlugs(): string[] {
  return [...RETIRED_INFO_SLUGS];
}

export function isRetiredInfoSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase().replace(/\.html$/i, "");
  return normalized === "thanks";
}

export function getSupportedInfoLanguages(): string[] {
  const set = new Set<string>();
  for (const byLang of Object.values(TEMPLATES)) {
    for (const code of Object.keys(byLang)) {
      set.add(code);
    }
  }
  return Array.from(set);
}
