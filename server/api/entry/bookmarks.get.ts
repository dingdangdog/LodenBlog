import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const query = getQuery(event);
    const page = Math.max(parseInt((query.page as string) || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt((query.pageSize as string) || "10", 10), 1),
      50
    );
    const languageCode = (query.languageCode as string) || "zh";

    const defaultLang = await prisma.language.findFirst({
      where: { isDefault: true },
      select: { code: true },
    });
    const defaultLanguageCode = defaultLang?.code || "zh";

    const [bookmarks, total] = await Promise.all([
      prisma.articleBookmark.findMany({
        where: { userId: user.id },
        select: { articleBaseId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.articleBookmark.count({
        where: { userId: user.id },
      }),
    ]);

    if (bookmarks.length === 0) {
      return success({
        articles: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const articleBaseIds = bookmarks.map((b) => b.articleBaseId);
    const bases = await prisma.articleBase.findMany({
      where: {
        id: { in: articleBaseIds },
        isPublished: true,
      },
      select: {
        id: true,
        authorId: true,
        featuredImage: true,
        publishedAt: true,
        viewCount: true,
        categorySlug: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const baseMap = new Map(bases.map((b) => [b.id, b]));
    const allContents = await prisma.articleContent.findMany({
      where: { articleBaseId: { in: articleBaseIds } },
      orderBy: { updatedAt: "desc" },
    });

    const contentMap = new Map<string, any>();
    for (const baseId of articleBaseIds) {
      const contents = allContents.filter((c) => c.articleBaseId === baseId);
      if (contents.length === 0) continue;
      let selected = contents.find((c) => c.languageCode === languageCode);
      if (!selected) {
        selected = contents.find((c) => c.languageCode === defaultLanguageCode);
      }
      if (!selected) selected = contents[0];
      contentMap.set(baseId, selected);
    }

    const authorIds = [...new Set(bases.map((b) => b.authorId))];
    const [allCreators, users] = await Promise.all([
      prisma.creator.findMany({
        where: { userId: { in: authorIds } },
        select: { userId: true, key: true, penName: true, avatar: true },
      }),
      prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true, avatar: true, username: true },
      }),
    ]);
    const creatorByUserId = new Map(allCreators.map((c) => [c.userId, c]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    const articles = bookmarks
      .map((b) => {
        const base = baseMap.get(b.articleBaseId);
        const content = contentMap.get(b.articleBaseId);
        if (!base || !content) return null;
        const creator = creatorByUserId.get(base.authorId as string);
        const authorUser = userMap.get(base.authorId as string);
        const tagSlugs = base.tags ? (JSON.parse(base.tags) as string[]) : [];
        return {
          id: base.id,
          contentId: content.id,
          slug: content.slug,
          title: content.title,
          excerpt: content.excerpt,
          featuredImage: base.featuredImage,
          publishedAt: base.publishedAt,
          createdAt: base.createdAt,
          updatedAt: base.updatedAt,
          viewCount: base.viewCount,
          languageCode: content.languageCode,
          categorySlug: base.categorySlug,
          tagSlugs,
          author: creator
            ? {
                name: creator.penName || authorUser?.name,
                avatar: creator.avatar || authorUser?.avatar,
                creatorKey: creator.key || "",
              }
            : authorUser
              ? { name: authorUser.name || authorUser.username, avatar: authorUser.avatar, creatorKey: "" }
              : null,
        };
      })
      .filter(Boolean);

    return success({
      articles,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return error(err.message || "获取收藏列表失败");
  }
});
