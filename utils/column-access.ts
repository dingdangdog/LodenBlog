export const FREE_CONTENT_MARKER = "<!--free-->";

export const ACCESS_TYPES = ["FREE", "COLUMN", "PAID"] as const;
export type AccessType = (typeof ACCESS_TYPES)[number];

export const SUBSCRIPTION_DURATIONS = [30, 90, 365] as const;
export type SubscriptionDuration = (typeof SUBSCRIPTION_DURATIONS)[number];

export const REDEEM_CODE_LENGTH = 16;
export const REDEEM_CODE_MAX_BATCH = 100;
export const REDEEM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 只按第一次 <!--free--> 切分。
 * 没有标记时返回 null；标记在文首时返回空字符串。
 */
export function splitFreeContent(content: string): string | null {
  const index = content.indexOf(FREE_CONTENT_MARKER);
  if (index < 0) return null;
  return content.slice(0, index);
}

/** 去掉第一次标记，后续标记保留在付费段。 */
export function stripFreeMarker(content: string): string {
  const index = content.indexOf(FREE_CONTENT_MARKER);
  if (index < 0) return content;
  return (
    content.slice(0, index) +
    content.slice(index + FREE_CONTENT_MARKER.length)
  );
}

export function isAccessType(value: string): value is AccessType {
  return (ACCESS_TYPES as readonly string[]).includes(value);
}

export function isSubscriptionDuration(
  value: number
): value is SubscriptionDuration {
  return (SUBSCRIPTION_DURATIONS as readonly number[]).includes(value);
}

export interface SubscriptionWindowInput {
  now: Date;
  currentStartsAt: Date | null;
  currentExpiresAt: Date | null;
  durationDays: number;
}

export interface SubscriptionWindow {
  startsAt: Date;
  expiresAt: Date;
  previousExpiresAt: Date | null;
  appliedFrom: Date;
  appliedTo: Date;
}

/**
 * 未过期时从当前 expiresAt 顺延，startsAt 保持不变。
 * 没有权益或已过期时，从 now 重新起算。
 */
export function nextSubscriptionWindow(
  input: SubscriptionWindowInput
): SubscriptionWindow {
  const active =
    input.currentExpiresAt != null &&
    input.currentExpiresAt.getTime() > input.now.getTime();
  const appliedFrom = active ? input.currentExpiresAt! : input.now;
  const appliedTo = new Date(appliedFrom.getTime() + input.durationDays * DAY_MS);
  return {
    startsAt:
      active && input.currentStartsAt ? input.currentStartsAt : input.now,
    expiresAt: appliedTo,
    previousExpiresAt: input.currentExpiresAt,
    appliedFrom,
    appliedTo,
  };
}

export function remainingDays(expiresAt: Date, now: Date): number {
  const diff = expiresAt.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / DAY_MS);
}

export function buildRedeemCode(
  randomIndex: (max: number) => number,
  length = REDEEM_CODE_LENGTH
): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += REDEEM_CODE_ALPHABET[randomIndex(REDEEM_CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeRedeemCode(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase();
}

export interface ArticleExternalLink {
  name: string;
  url: string;
  description?: string;
}

export const EXTERNAL_LINK_MAX_COUNT = 10;
export const EXTERNAL_LINK_NAME_MAX = 30;
export const EXTERNAL_LINK_URL_MAX = 500;
export const EXTERNAL_LINK_DESCRIPTION_MAX = 100;

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export type ExternalLinksResult =
  | { ok: true; links: ArticleExternalLink[] }
  | { ok: false; message: string };

/** 名称和链接都为空的行视为未填写，直接丢弃。 */
export function normalizeExternalLinks(raw: unknown): ExternalLinksResult {
  if (raw == null) return { ok: true, links: [] };
  if (!Array.isArray(raw)) return { ok: false, message: "外链格式无效" };

  const links: ArticleExternalLink[] = [];
  for (const item of raw) {
    const row = (item ?? {}) as Record<string, unknown>;
    const name = String(row.name ?? "").trim();
    const url = String(row.url ?? "").trim();
    const description = String(row.description ?? "").trim();
    if (!name && !url) continue;
    if (!name) return { ok: false, message: "外链缺少平台名称" };
    if (name.length > EXTERNAL_LINK_NAME_MAX) {
      return { ok: false, message: `平台名称不能超过 ${EXTERNAL_LINK_NAME_MAX} 个字符` };
    }
    if (!url || url.length > EXTERNAL_LINK_URL_MAX || !isHttpUrl(url)) {
      return { ok: false, message: `「${name}」的链接需以 http:// 或 https:// 开头` };
    }
    if (description.length > EXTERNAL_LINK_DESCRIPTION_MAX) {
      return {
        ok: false,
        message: `外链说明不能超过 ${EXTERNAL_LINK_DESCRIPTION_MAX} 个字符`,
      };
    }
    links.push(description ? { name, url, description } : { name, url });
  }
  if (links.length > EXTERNAL_LINK_MAX_COUNT) {
    return { ok: false, message: `外链最多 ${EXTERNAL_LINK_MAX_COUNT} 个` };
  }
  return { ok: true, links };
}

export function serializeExternalLinks(links: ArticleExternalLink[]): string | null {
  return links.length > 0 ? JSON.stringify(links) : null;
}

/** 读取库内 JSON；损坏或不合规的数据不下发到前台。 */
export function parseExternalLinks(stored: string | null | undefined): ArticleExternalLink[] {
  if (!stored) return [];
  try {
    const result = normalizeExternalLinks(JSON.parse(stored));
    return result.ok ? result.links : [];
  } catch {
    return [];
  }
}
