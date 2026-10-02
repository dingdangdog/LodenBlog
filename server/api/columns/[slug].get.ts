import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { getCurrentUser } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const slugParam = getRouterParam(event, "slug");
    if (!slugParam) return error("专栏 slug 不能为空");
    const slug = slugParam.toLowerCase();
    const languageCode = String(getQuery(event).languageCode || "");

    let content = languageCode
      ? await prisma.columnContent.findFirst({ where: { slug, languageCode } })
      : null;
    if (!content) {
      const any = await prisma.columnContent.findFirst({
        where: { slug },
        orderBy: { createdAt: "asc" },
      });
      if (any && languageCode) {
        content =
          (await prisma.columnContent.findFirst({
            where: { columnId: any.columnId, languageCode },
          })) || any;
      } else {
        content = any;
      }
    }
    if (!content) return error("专栏不存在", null);

    const column = await prisma.column.findUnique({
      where: { id: content.columnId },
    });
    if (!column || !column.isPublished) return error("专栏不存在", null);

    const viewer = await getCurrentUser(event);
    const subscription = viewer
      ? await prisma.columnSubscription.findUnique({
          where: {
            userId_columnId: { userId: viewer.id, columnId: column.id },
          },
        })
      : null;
    const now = new Date();
    const subscribed = !!subscription && subscription.expiresAt.getTime() > now.getTime();

    const bases = await prisma.articleBase.findMany({
      where: {
        columnId: column.id,
        accessType: "COLUMN",
        isPublished: true,
        publishedAt: { lte: now },
      },
      orderBy: { publishedAt: "desc" },
    });
    const contents = bases.length
      ? await prisma.articleContent.findMany({
          where: { articleBaseId: { in: bases.map((item) => item.id) } },
          select: {
            articleBaseId: true,
            languageCode: true,
            slug: true,
            title: true,
            excerpt: true,
          },
        })
      : [];

    const articles = bases
      .map((base) => {
        const localized =
          contents.find(
            (item) =>
              item.articleBaseId === base.id &&
              item.languageCode === (languageCode || content.languageCode)
          ) || contents.find((item) => item.articleBaseId === base.id);
        if (!localized) return null;
        return {
          id: base.id,
          slug: localized.slug,
          title: localized.title,
          excerpt: localized.excerpt,
          featuredImage: base.featuredImage,
          publishedAt: base.publishedAt,
          accessType: base.accessType,
          locked: !subscribed && viewer?.id !== column.authorId,
        };
      })
      .filter((item) => item !== null);

    const languages = await prisma.columnContent.findMany({
      where: { columnId: column.id },
      select: { languageCode: true, slug: true, title: true },
    });

    return success({
      column: {
        id: column.id,
        slug: content.slug,
        title: content.title,
        description: content.description,
        featuredImage: column.featuredImage,
        seoTitle: content.seoTitle,
        seoDescription: content.seoDescription,
        seoKeyword: content.seoKeyword,
        languageCode: content.languageCode,
        subscribed,
        subscriptionExpiresAt: subscription?.expiresAt ?? null,
        languages,
      },
      articles,
    });
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : "获取专栏失败");
  }
});
