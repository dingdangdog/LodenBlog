import { randomInt } from "node:crypto";
import prisma from "~~/lib/prisma";
import { ROLE_LEVEL } from "~~/utils/role";
import {
  buildRedeemCode,
  isAccessType,
  isSubscriptionDuration,
  nextSubscriptionWindow,
  normalizeRedeemCode,
  REDEEM_CODE_MAX_BATCH,
  remainingDays,
  stripFreeMarker,
  type AccessType,
} from "~~/utils/column-access";

export class DomainError extends Error {}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function normalizeArticleAccess(
  authorId: string,
  accessTypeRaw: unknown,
  columnIdRaw: unknown
): Promise<{ accessType: AccessType; columnId: string | null }> {
  const accessType = String(accessTypeRaw || "FREE").toUpperCase();
  if (!isAccessType(accessType)) {
    throw new DomainError("访问类型无效");
  }
  if (accessType !== "COLUMN") {
    return { accessType, columnId: null };
  }
  const columnId = typeof columnIdRaw === "string" ? columnIdRaw.trim() : "";
  if (!columnId) {
    throw new DomainError("专栏文章必须选择专栏");
  }
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { id: true, authorId: true },
  });
  if (!column || column.authorId !== authorId) {
    throw new DomainError("专栏不存在或不属于该作者");
  }
  return { accessType, columnId };
}

export function publishFlags(input: {
  status?: unknown;
  isPublished?: unknown;
}): { status: "DRAFT" | "PUBLISHED"; isPublished: boolean } {
  const published = input.isPublished === true || input.status === "PUBLISHED";
  return {
    status: published ? "PUBLISHED" : "DRAFT",
    isPublished: published,
  };
}

function pickContent<T extends { languageCode: string }>(
  rows: T[],
  languageCode: string
): T | null {
  return (
    rows.find((row) => row.languageCode === languageCode) ||
    rows.find((row) => row.languageCode === "zh") ||
    rows[0] ||
    null
  );
}

export async function loadColumnSummary(
  columnId: string,
  languageCode: string
) {
  const column = await prisma.column.findUnique({ where: { id: columnId } });
  if (!column) return null;
  const contents = await prisma.columnContent.findMany({
    where: { columnId },
  });
  const content = pickContent(contents, languageCode);
  return {
    column,
    content,
    contents,
  };
}

export interface ArticleReadResult {
  content: string;
  locked: boolean;
  lockReason:
    | "UNSUBSCRIBED"
    | "EXPIRED"
    | "UNPAID"
    | "COLUMN_UNPUBLISHED"
    | null;
  accessType: string;
  column: { id: string; slug: string; title: string } | null;
  subscriptionExpiresAt: string | null;
}

export async function resolveArticleRead(input: {
  viewerId: string | null;
  viewerRole: number;
  articleBase: {
    id: string;
    authorId: string;
    accessType: string;
    columnId: string | null;
  };
  rawContent: string;
  freeContent: string | null;
  languageCode: string;
}): Promise<ArticleReadResult> {
  const accessType = input.articleBase.accessType || "FREE";
  const preview = input.freeContent ?? "";
  const full = stripFreeMarker(input.rawContent);
  const isStaff =
    input.viewerId === input.articleBase.authorId ||
    input.viewerRole >= ROLE_LEVEL.ADMIN;

  let column: ArticleReadResult["column"] = null;
  if (accessType === "COLUMN" && input.articleBase.columnId) {
    const summary = await loadColumnSummary(
      input.articleBase.columnId,
      input.languageCode
    );
    if (summary?.content) {
      column = {
        id: summary.column.id,
        slug: summary.content.slug,
        title: summary.content.title,
      };
    } else if (summary) {
      column = {
        id: summary.column.id,
        slug: "",
        title: "",
      };
    }
    if (isStaff) {
      return {
        content: full,
        locked: false,
        lockReason: null,
        accessType,
        column,
        subscriptionExpiresAt: null,
      };
    }
    if (!summary?.column.isPublished) {
      return {
        content: preview,
        locked: true,
        lockReason: "COLUMN_UNPUBLISHED",
        accessType,
        column,
        subscriptionExpiresAt: null,
      };
    }
    const subscription = input.viewerId
      ? await prisma.columnSubscription.findUnique({
          where: {
            userId_columnId: {
              userId: input.viewerId,
              columnId: summary.column.id,
            },
          },
        })
      : null;
    const expiresAt = subscription?.expiresAt ?? null;
    const active = !!expiresAt && expiresAt.getTime() > Date.now();
    return {
      content: active ? full : preview,
      locked: !active,
      lockReason: active ? null : subscription ? "EXPIRED" : "UNSUBSCRIBED",
      accessType,
      column,
      subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : null,
    };
  }

  if (isStaff || accessType === "FREE") {
    return {
      content: full,
      locked: false,
      lockReason: null,
      accessType,
      column: null,
      subscriptionExpiresAt: null,
    };
  }

  if (accessType === "PAID") {
    const unlock = input.viewerId
      ? await prisma.articleUnlock.findUnique({
          where: {
            userId_articleBaseId: {
              userId: input.viewerId,
              articleBaseId: input.articleBase.id,
            },
          },
        })
      : null;
    return {
      content: unlock ? full : preview,
      locked: !unlock,
      lockReason: unlock ? null : "UNPAID",
      accessType,
      column: null,
      subscriptionExpiresAt: null,
    };
  }

  return {
    content: preview,
    locked: true,
    lockReason: accessType === "PAID" ? "UNPAID" : "UNSUBSCRIBED",
    accessType,
    column: null,
    subscriptionExpiresAt: null,
  };
}

async function codeExists(code: string, tx: Tx | typeof prisma = prisma) {
  const [columnCode, articleCode] = await Promise.all([
    tx.columnRedeemCode.findUnique({ where: { code }, select: { id: true } }),
    tx.articleRedeemCode.findUnique({ where: { code }, select: { id: true } }),
  ]);
  return !!(columnCode || articleCode);
}

export async function createUniqueRedeemCodes(count: number): Promise<string[]> {
  if (!Number.isInteger(count) || count < 1 || count > REDEEM_CODE_MAX_BATCH) {
    throw new DomainError(`单次最多生成 ${REDEEM_CODE_MAX_BATCH} 个兑换码`);
  }
  const codes: string[] = [];
  const seen = new Set<string>();
  while (codes.length < count) {
    let code = "";
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const next = buildRedeemCode((max) => randomInt(max));
      if (seen.has(next)) continue;
      if (await codeExists(next)) continue;
      code = next;
      break;
    }
    if (!code) {
      throw new DomainError("生成兑换码失败，请重试");
    }
    seen.add(code);
    codes.push(code);
  }
  return codes;
}

function statusError(status: string): string {
  if (status === "USED") return "兑换码已使用";
  if (status === "REVOKED") return "兑换码已作废";
  return "兑换码无效";
}

export async function redeemByCode(userId: string, rawCode: unknown) {
  const code = normalizeRedeemCode(rawCode);
  if (!code) throw new DomainError("请输入兑换码");

  const columnCode = await prisma.columnRedeemCode.findUnique({
    where: { code },
  });
  if (columnCode) {
    return redeemColumnCode(userId, columnCode.id);
  }
  const articleCode = await prisma.articleRedeemCode.findUnique({
    where: { code },
  });
  if (articleCode) {
    return redeemArticleCode(userId, articleCode.id);
  }
  throw new DomainError("兑换码无效");
}

async function redeemColumnCode(userId: string, codeId: string) {
  const code = await prisma.columnRedeemCode.findUnique({ where: { id: codeId } });
  if (!code) throw new DomainError("兑换码无效");
  if (code.status !== "UNUSED") throw new DomainError(statusError(code.status));
  if (!isSubscriptionDuration(code.durationDays)) {
    throw new DomainError("兑换码无效");
  }

  const column = await prisma.column.findUnique({ where: { id: code.columnId } });
  if (!column || !column.isPublished) throw new DomainError("专栏未发布");
  if (column.authorId === userId) throw new DomainError("不能兑换自己的专栏");

  const now = new Date();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.columnRedeemCode.updateMany({
        where: { id: code.id, status: "UNUSED" },
        data: { status: "USED", usedBy: userId, usedAt: now },
      });
      if (claimed.count !== 1) {
        throw new DomainError("兑换码已使用");
      }
      const existing = await tx.columnSubscription.findUnique({
        where: { userId_columnId: { userId, columnId: column.id } },
      });
      const window = nextSubscriptionWindow({
        now,
        currentStartsAt: existing?.startsAt ?? null,
        currentExpiresAt: existing?.expiresAt ?? null,
        durationDays: code.durationDays,
      });
      if (existing) {
        await tx.columnSubscription.update({
          where: { id: existing.id },
          data: {
            startsAt: window.startsAt,
            expiresAt: window.expiresAt,
            source: "REDEEM",
          },
        });
      } else {
        await tx.columnSubscription.create({
          data: {
            userId,
            columnId: column.id,
            startsAt: window.startsAt,
            expiresAt: window.expiresAt,
            source: "REDEEM",
          },
        });
      }
      await tx.columnSubscriptionLog.create({
        data: {
          userId,
          columnId: column.id,
          source: "REDEEM",
          redeemCodeId: code.id,
          durationDays: code.durationDays,
          previousExpiresAt: window.previousExpiresAt,
          appliedFrom: window.appliedFrom,
          appliedTo: window.appliedTo,
        },
      });
      return window;
    });
    return {
      kind: "COLUMN" as const,
      columnId: column.id,
      expiresAt: result.expiresAt.toISOString(),
      durationDays: code.durationDays,
    };
  } catch (err) {
    if (err instanceof DomainError) throw err;
    throw new DomainError("兑换失败");
  }
}

async function redeemArticleCode(userId: string, codeId: string) {
  const code = await prisma.articleRedeemCode.findUnique({ where: { id: codeId } });
  if (!code) throw new DomainError("兑换码无效");
  if (code.status !== "UNUSED") throw new DomainError(statusError(code.status));

  const article = await prisma.articleBase.findUnique({
    where: { id: code.articleBaseId },
  });
  if (!article || !article.isPublished) throw new DomainError("文章未发布");
  if (article.authorId === userId) throw new DomainError("不能兑换自己的文章");
  if (article.accessType !== "PAID") throw new DomainError("该兑换码已失效");

  const existingUnlock = await prisma.articleUnlock.findUnique({
    where: {
      userId_articleBaseId: { userId, articleBaseId: article.id },
    },
  });
  if (existingUnlock) throw new DomainError("已经解锁这篇文章");

  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const stillLocked = await tx.articleUnlock.findUnique({
        where: {
          userId_articleBaseId: { userId, articleBaseId: article.id },
        },
      });
      if (stillLocked) throw new DomainError("已经解锁这篇文章");
      const claimed = await tx.articleRedeemCode.updateMany({
        where: { id: code.id, status: "UNUSED" },
        data: { status: "USED", usedBy: userId, usedAt: now },
      });
      if (claimed.count !== 1) throw new DomainError("兑换码已使用");
      await tx.articleUnlock.create({
        data: {
          userId,
          articleBaseId: article.id,
          source: "REDEEM",
          redeemCodeId: code.id,
          unlockedAt: now,
        },
      });
    });
  } catch (err) {
    if (err instanceof DomainError) throw err;
    throw new DomainError("兑换失败");
  }
  return { kind: "ARTICLE" as const, articleBaseId: article.id };
}

export async function requireOwnColumn(userId: string, columnId: string) {
  const column = await prisma.column.findUnique({ where: { id: columnId } });
  if (!column || column.authorId !== userId) {
    throw new DomainError("专栏不存在");
  }
  return column;
}

export async function requireOwnArticle(userId: string, articleBaseId: string) {
  const article = await prisma.articleBase.findUnique({
    where: { id: articleBaseId },
  });
  if (!article || article.authorId !== userId) {
    throw new DomainError("文章不存在");
  }
  return article;
}

export function subscriptionView(
  row: { startsAt: Date; expiresAt: Date },
  now = new Date()
) {
  const active = row.expiresAt.getTime() > now.getTime();
  return {
    active,
    remainingDays: remainingDays(row.expiresAt, now),
  };
}

export async function columnCardsForAuthor(
  authorId: string,
  languageCode: string,
  onlyPublished: boolean
) {
  const columns = await prisma.column.findMany({
    where: {
      authorId,
      ...(onlyPublished ? { isPublished: true } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  if (columns.length === 0) return [];
  const contents = await prisma.columnContent.findMany({
    where: { columnId: { in: columns.map((item) => item.id) } },
  });
  return columns.map((column) => {
    const localized = pickContent(
      contents.filter((item) => item.columnId === column.id),
      languageCode
    );
    return {
      id: column.id,
      status: column.status,
      isPublished: column.isPublished,
      featuredImage: column.featuredImage,
      updatedAt: column.updatedAt,
      slug: localized?.slug || "",
      title: localized?.title || "",
      description: localized?.description || "",
      languageCode: localized?.languageCode || languageCode,
    };
  });
}
