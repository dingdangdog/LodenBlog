import prisma from "~~/lib/prisma";

type Changefreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";
type Priority = 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;

interface SitemapRoute {
  loc: string;
  lastmod: string;
  changefreq: Changefreq;
  priority: Priority;
  alternatives?: Array<{
    hreflang: string;
    href: string;
  }>;
}

export default defineSitemapEventHandler(async (e) => {
  const routes: SitemapRoute[] = [];

  try {
    // 1. 查询已发布的文章
    const publishedBases = await prisma.articleBase.findMany({
      where: {
        isPublished: true,
        publishedAt: { lte: new Date() },
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    const articleBaseIds = publishedBases.map((b: { id: string }) => b.id);
    const baseMap = new Map<string, { id: string; updatedAt: Date }>(
      publishedBases.map((b: { id: string; updatedAt: Date }) => [b.id, b])
    );

    // 2. 查询文章内容（所有语言版本）
    const articleContents =
      articleBaseIds.length > 0
        ? await prisma.articleContent.findMany({
            where: { articleBaseId: { in: articleBaseIds } },
            select: {
              slug: true,
              languageCode: true,
              updatedAt: true,
              articleBaseId: true,
            },
          })
        : [];

    // 3. 查询创作者
    const creators = await prisma.creator.findMany({
      select: { key: true, updatedAt: true },
    });

    // 4. 查询激活的语言
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      select: { code: true },
    });

    const defaultLocale = "zh";
    const locales =
      languages.length > 0
        ? languages.map((l: { code: string }) => l.code)
        : ["zh", "en", "ja"];

    // 5. 添加首页
    locales.forEach((locale: string) => {
      const alternatives = locales.map((lang: string) => ({
        hreflang: lang,
        href: lang === defaultLocale ? "/" : `/${lang}/`,
      }));

      routes.push({
        loc: locale === defaultLocale ? "/" : `/${locale}/`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 1.0,
        alternatives,
      });
    });

    // 6. 添加文章路由
    const articleMap = new Map<string, typeof articleContents>();
    articleContents.forEach(
      (article: {
        slug: string;
        languageCode: string;
        updatedAt: Date;
        articleBaseId: string;
      }) => {
        if (!articleMap.has(article.articleBaseId)) {
          articleMap.set(article.articleBaseId, []);
        }
        articleMap.get(article.articleBaseId)!.push(article);
      }
    );

    articleContents.forEach(
      (content: {
        slug: string;
        languageCode: string;
        updatedAt: Date;
        articleBaseId: string;
      }) => {
        const base = baseMap.get(content.articleBaseId);
        const lastmod = (base && base.updatedAt) || content.updatedAt;

        const sameBaseArticles = articleMap.get(content.articleBaseId) || [];
        const alternatives = locales
          .map((lang: string) => {
            const alt = sameBaseArticles.find(
              (a: { languageCode: string }) => a.languageCode === lang
            );
            return alt
              ? {
                  hreflang: lang,
                  href:
                    lang === defaultLocale
                      ? `/post/${alt.slug}`
                      : `/${lang}/post/${alt.slug}`,
                }
              : null;
          })
          .filter(
            (
              a: { hreflang: string; href: string } | null
            ): a is { hreflang: string; href: string } => a !== null
          );

        routes.push({
          loc:
            content.languageCode === defaultLocale
              ? `/post/${content.slug}`
              : `/${content.languageCode}/post/${content.slug}`,
          lastmod: lastmod.toISOString(),
          changefreq: "weekly",
          priority: 0.8,
          alternatives,
        });
      }
    );

    // 7. 添加创作者路由
    creators.forEach((creator: { key: string; updatedAt: Date }) => {
      const alternatives = locales.map((lang: string) => ({
        hreflang: lang,
        href:
          lang === defaultLocale
            ? `/author/${creator.key}`
            : `/${lang}/author/${creator.key}`,
      }));

      locales.forEach((locale: string) => {
        routes.push({
          loc:
            locale === defaultLocale
              ? `/author/${creator.key}`
              : `/${locale}/author/${creator.key}`,
          lastmod: creator.updatedAt.toISOString(),
          changefreq: "monthly",
          priority: 0.6,
          alternatives,
        });
      });
    });
  } catch (error) {
    console.error("生成 sitemap 失败:", error);
  }

  return routes;
});
