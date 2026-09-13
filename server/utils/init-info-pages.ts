import prisma from "~~/lib/prisma";
import type { InfoKey } from "~~/server/info-template/types";
import {
  buildInfoContent,
  getInfoSlugs,
  getSupportedInfoLanguages,
  isRetiredInfoSlug,
} from "~~/server/info-template";

/** 支持传入默认 prisma 或事务 tx */
type PrismaLike = Pick<typeof prisma, "infoBase" | "infoContent">;

export type InitInfoPagesOptions = {
  siteName: string;
  domain?: string;
  languageCodes: string[];
  db?: PrismaLike;
};

/**
 * 初始化信息页（用户协议、隐私政策、关于）
 * 可被系统初始化接口、数据库启动插件或其他逻辑直接调用
 */
export async function initInfoPages(options: InitInfoPagesOptions): Promise<void> {
  const { siteName, domain, languageCodes, db: client } = options;
  const db = client ?? prisma;

  const supportedInfoLangs = getSupportedInfoLanguages();
  const slugs = getInfoSlugs();

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    if (!slug) continue;
    const infoBase = await db.infoBase.create({
      data: { slug, sortOrder: i },
    });
    for (const langCode of languageCodes) {
      const templateLang = supportedInfoLangs.includes(langCode)
        ? langCode
        : "en";
      const { title, content } = buildInfoContent(
        templateLang,
        slug.replace(/\.html$/i, "") as InfoKey,
        siteName,
        domain
      );
      await db.infoContent.create({
        data: {
          infoBaseId: infoBase.id,
          languageCode: langCode,
          title,
          content,
        },
      });
    }
  }
}

/**
 * 检查信息页是否已初始化（仅检查表中是否有数据）
 */
export async function isInfoPagesInitialized(db?: PrismaLike): Promise<boolean> {
  const client = db ?? prisma;
  const count = await client.infoBase.count();
  return count > 0;
}

/** 删除已下线信息页（如致谢）及其各语言内容，幂等 */
export async function removeRetiredInfoPages(
  db?: PrismaLike
): Promise<number> {
  const client = db ?? prisma;
  const bases = await client.infoBase.findMany({
    select: { id: true, slug: true },
  });
  const retired = bases.filter((base) => isRetiredInfoSlug(base.slug));
  if (retired.length < 1) {
    return 0;
  }

  const ids = retired.map((base) => base.id);
  await client.infoContent.deleteMany({
    where: { infoBaseId: { in: ids } },
  });
  await client.infoBase.deleteMany({
    where: { id: { in: ids } },
  });
  return bases.length;
}
