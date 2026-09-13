import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

// 定义类型
type ArticleBaseSelect = {
  id: string;
  featuredImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  pinOrder: number;
  categorySlug: string | null;
  tags: string | null;
  authorId: string;
};

type ArticleContentType = {
  id: string;
  articleBaseId: string;
  languageCode: string;
  slug: string;
  title: string;
  excerpt: string | null;
};

type UserSelect = {
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
};

type CreatorSelect = {
  userId: string;
  key: string | null;
  penName: string | null;
  avatar: string | null;
};

type ArticleAuthor = {
  id: string;
  name: string;
  avatar: string | null;
  username: string;
  creatorKey: string | null;
};

type Article = {
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
  authorId: string;
  author: ArticleAuthor | null;
};

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const languageCode =
      (query.language as string) || (query.languageCode as string) || "zh";
    const status = (query.status as string) || "PUBLISHED";
    const categorySlug = query.categorySlug as string;
    const tagSlug = query.tagSlug as string;

    // 获取默认语言
    const defaultLang = await prisma.language.findFirst({
      where: { isDefault: true },
      select: { code: true },
    });
    const defaultLanguageCode = defaultLang?.code || "zh";

    // 构建 ArticleBase 的 where 条件
    const baseWhere: {
      isPublished: boolean;
      publishedAt?: { lte: Date };
      status?: string;
      categorySlug?: string;
    } = {
      isPublished: true,
    };

    if (status === "PUBLISHED") {
      baseWhere.isPublished = true;
      baseWhere.publishedAt = { lte: new Date() };
    } else if (status) {
      baseWhere.status = status;
    }

    if (categorySlug) {
      baseWhere.categorySlug = categorySlug;
    }

    // 如果指定了tagSlug，需要先查询所有符合条件的文章，然后过滤包含该tag的文章
    let allArticleBases: ArticleBaseSelect[] = [];
    if (tagSlug) {
      // 先查询所有已发布的文章
      const bases = await prisma.articleBase.findMany({
        where: baseWhere,
        select: {
          id: true,
          featuredImage: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          viewCount: true,
          pinOrder: true,
          categorySlug: true,
          tags: true,
          authorId: true,
        },
        orderBy: [{ pinOrder: "desc" }, { publishedAt: "desc" }],
      });

      // 过滤包含指定tag的文章后保持 pinOrder desc, publishedAt desc 顺序
      allArticleBases = bases.filter((base: ArticleBaseSelect) => {
        if (!base.tags) return false;
        try {
          const tagSlugs = JSON.parse(base.tags) as string[];
          return tagSlugs.includes(tagSlug);
        } catch {
          return false;
        }
      });
    }

    // 计算总数
    const total = tagSlug
      ? allArticleBases.length
      : await prisma.articleBase.count({
        where: baseWhere,
      });

    // 分页处理
    const paginatedBases: ArticleBaseSelect[] = tagSlug
      ? allArticleBases.slice((page - 1) * pageSize, page * pageSize)
      : await prisma.articleBase.findMany({
        where: baseWhere,
        select: {
          id: true,
          featuredImage: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          viewCount: true,
          pinOrder: true,
          categorySlug: true,
          tags: true,
          authorId: true,
        },
        orderBy: [{ pinOrder: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

    const articleBases = paginatedBases;

    if (articleBases.length === 0) {
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

    const articleBaseIds = articleBases.map(
      (base: ArticleBaseSelect) => base.id
    );
    const authorIds = [
      ...new Set(articleBases.map((base: ArticleBaseSelect) => base.authorId)),
    ];

    // 查询所有 ArticleContent
    const allContents = await prisma.articleContent.findMany({
      where: {
        articleBaseId: { in: articleBaseIds },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        articleBaseId: true,
        languageCode: true,
        slug: true,
        title: true,
        excerpt: true,
      },
    });

    // 查询作者信息（User 和 Creator）
    const [users, creators] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      }),
      prisma.creator.findMany({
        where: { userId: { in: authorIds } },
        select: {
          userId: true,
          key: true,
          penName: true,
          avatar: true,
        },
      }),
    ]);

    const userMap = new Map<string, UserSelect>(
      users.map((u: UserSelect) => [u.id, u])
    );
    const creatorMap = new Map<string, CreatorSelect>(
      creators.map((c: CreatorSelect) => [c.userId, c])
    );

    // 按 articleBaseId 分组，为每个 ArticleBase 选择最合适的 Content
    const contentMap = new Map<string, ArticleContentType>();
    for (const baseId of articleBaseIds) {
      const contents = allContents.filter(
        (c: ArticleContentType) => c.articleBaseId === baseId
      );
      if (contents.length === 0) continue;

      // 优先级：当前语言 > 默认语言 > 其他
      let selected: ArticleContentType | undefined = contents.find(
        (c: ArticleContentType) => c.languageCode === languageCode
      );
      if (!selected) {
        selected = contents.find(
          (c: ArticleContentType) => c.languageCode === defaultLanguageCode
        );
      }
      if (!selected) {
        selected = contents[0];
      }
      if (selected) {
        contentMap.set(baseId, selected);
      }
    }

    // 合并数据
    const articles: Article[] = articleBases
      .map((base: ArticleBaseSelect) => {
        const content = contentMap.get(base.id);
        if (!content) return null;

        const tagSlugs = base.tags ? (JSON.parse(base.tags) as string[]) : [];

        // 获取作者信息
        const user = userMap.get(base.authorId);
        const creator = creatorMap.get(base.authorId);
        const author: ArticleAuthor | null = user
          ? {
            id: user.id,
            name: creator?.penName || user.name || user.username,
            avatar: creator?.avatar || user.avatar,
            username: user.username,
            creatorKey: creator?.key || null,
          }
          : null;

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
          authorId: base.authorId,
          author,
        };
      })
      .filter((item): item is Article => item !== null);

    return success({
      articles,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "获取文章列表失败";
    return error(errorMessage);
  }
});
