import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import type { Prisma } from "~~/prisma/generated/client";

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, "key");
    const query = getQuery(event);
    const page = Math.max(parseInt((query.page as string) || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt((query.pageSize as string) || "10", 10), 1),
      50
    );
    const languageCode = (query.languageCode as string) || "zh";

    if (!key) {
      return error("创作者 key 不能为空");
    }

    // 获取默认语言
    const defaultLang = await prisma.language.findFirst({
      where: { isDefault: true },
      select: { code: true },
    });
    const defaultLanguageCode = defaultLang?.code || "zh";

    // 查询 Creator 信息（不区分大小写）
    const creator = await prisma.creator.findFirst({
      where: {
        key: {
          equals: key,
          mode: "insensitive",
        },
      },
    });

    if (!creator) {
      return error("创作者不存在", null);
    }

    // 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: creator.userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
      },
    });

    if (!user) {
      return error("用户信息不存在", null);
    }

    // 查询该创作者发布的文章（只查询已发布的）
    const baseWhere: Prisma.ArticleBaseWhereInput = {
      authorId: creator.userId,
      isPublished: true,
      publishedAt: { lte: new Date() },
    };

    // 先查询符合条件的 ArticleBase（按发布时间排序，用于分页）
    const [articleBases, total] = await Promise.all([
      prisma.articleBase.findMany({
        where: baseWhere,
        select: {
          id: true,
          featuredImage: true,
          publishedAt: true,
          viewCount: true,
          categorySlug: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.articleBase.count({
        where: baseWhere,
      }),
    ]);

    if (articleBases.length === 0) {
      return success({
        creator: {
          id: creator.id,
          key: creator.key,
          penName: creator.penName || user.name || user.username,
          avatar: creator.avatar || user.avatar,
          bio: creator.bio || user.bio,
          username: user.username,
          name: user.name,
          createdAt: creator.createdAt,
          updatedAt: creator.updatedAt,
        },
        articles: [],
        stats: {
          totalArticles: 0,
          totalViews: 0,
        },
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const articleBaseIds = articleBases.map((base) => base.id);

    // 查询所有 ArticleContent
    const allContents = await prisma.articleContent.findMany({
      where: {
        articleBaseId: { in: articleBaseIds },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 按 articleBaseId 分组，为每个 ArticleBase 选择最合适的 Content
    const contentMap = new Map<string, any>();
    for (const baseId of articleBaseIds) {
      const contents = allContents.filter((c) => c.articleBaseId === baseId);
      if (contents.length === 0) continue;

      // 优先级：当前语言 > 默认语言 > 其他
      let selected = contents.find((c) => c.languageCode === languageCode);
      if (!selected) {
        selected = contents.find((c) => c.languageCode === defaultLanguageCode);
      }
      if (!selected) {
        selected = contents[0];
      }
      contentMap.set(baseId, selected);
    }

    // 转换数据格式
    type ArticleItem = {
      id: string;
      contentId: string;
      slug: string;
      title: string;
      excerpt: string | null;
      featuredImage: string | null;
      publishedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      viewCount: number;
      languageCode: string;
      categorySlug: string | null;
      tagSlugs: string[];
    };

    const articles: ArticleItem[] = articleBases
      .map((base) => {
        const content = contentMap.get(base.id);
        if (!content) return null;

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
        };
      })
      .filter((item): item is ArticleItem => item !== null);

    // 统计信息
    const allBases = await prisma.articleBase.findMany({
      where: baseWhere,
      select: { viewCount: true },
    });
    const stats = {
      totalArticles: total,
      totalViews: allBases.reduce((sum, base) => sum + base.viewCount, 0),
    };

    // 合并创作者信息
    const creatorInfo = {
      id: creator.id,
      key: creator.key,
      penName: creator.penName || user.name || user.username,
      avatar: creator.avatar || user.avatar,
      bio: creator.bio || user.bio,
      username: user.username,
      name: user.name,
      createdAt: creator.createdAt,
      updatedAt: creator.updatedAt,
    };

    return success({
      creator: creatorInfo,
      articles,
      stats,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取创作者信息失败";
    return error(message);
  }
});
