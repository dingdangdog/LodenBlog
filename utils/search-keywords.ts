/** 单次查询最多保留的关键词数量，避免过长输入打出过大 AND 条件。 */
export const MAX_SEARCH_KEYWORDS = 8;

/**
 * 空白（含全角空格）、中英文顿号/逗号/分号、竖线、间隔号。
 * 不拆连字符、点号、加号，以保留 docker-compose、Vue.js、C++ 这类词。
 */
const KEYWORD_SEPARATORS = /[\s,，、;；|｜·•]+/;

/**
 * 将搜索输入拆成多个关键词。
 * 例如「Docker、Java 后端」→ ["Docker", "Java", "后端"]。
 */
export function splitSearchKeywords(
  raw: string,
  max = MAX_SEARCH_KEYWORDS
): string[] {
  const input = raw.trim();
  if (!input) return [];

  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const part of input.split(KEYWORD_SEPARATORS)) {
    const token = part.trim();
    if (!token) continue;

    const key = token.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    keywords.push(token);
    if (keywords.length >= max) break;
  }

  return keywords;
}

type InsensitiveContains = {
  contains: string;
  mode: "insensitive";
};

type FieldContains = Record<string, InsensitiveContains>;

/**
 * 生成「每个关键词都必须命中至少一个字段」的 Prisma where。
 * 多关键词之间为 AND；同一关键词在多个字段之间为 OR。
 */
export function buildAllKeywordsMatchWhere(
  keywords: string[],
  fields: readonly string[]
) {
  if (keywords.length === 0 || fields.length === 0) {
    return undefined;
  }

  const contains = (field: string, keyword: string): FieldContains => ({
    [field]: { contains: keyword, mode: "insensitive" },
  });

  if (fields.length === 1) {
    const field = fields[0]!;
    if (keywords.length === 1) {
      return contains(field, keywords[0]!);
    }
    return {
      AND: keywords.map((keyword) => contains(field, keyword)),
    };
  }

  return {
    AND: keywords.map((keyword) => ({
      OR: fields.map((field) => contains(field, keyword)),
    })),
  };
}
