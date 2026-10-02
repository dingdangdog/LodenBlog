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
