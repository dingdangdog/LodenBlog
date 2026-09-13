import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import {
  splitSearchKeywords,
  buildAllKeywordsMatchWhere,
} from "~~/utils/search-keywords";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const query = getQuery(event);
    const page = Math.max(parseInt((query.page as string) || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt((query.pageSize as string) || "10", 10), 1),
      50
    );
    const search = (query.search as string) || "";
    const articleId = (query.id as string) || "";
    const slug = (query.slug as string) || "";
    const languageCode = (query.languageCode as string) || "zh";
    const isPublished = query.isPublished;
    const tagSlug = (query.tagSlug as string) || "";
    const categorySlug = (query.categorySlug as string) || "";
    const sortBy = (query.sortBy as string) || "createdAt"; // 排序字段：createdAt, viewCount, updatedAt
    const sortOrder = (query.sortOrder as string) || "desc"; // 排序方向：asc, desc

    // 获取默认语言
    const defaultLang = await prisma.language.findFirst({
      where: { isDefault: true },
      select: { code: true },
    });
    const defaultLanguageCode = defaultLang?.code || "zh";

    // 构建 ArticleBase 的 where 条件
    const baseWhere: any = {};

    if (user.role < ROLE_LEVEL.ADMIN) {
      baseWhere.authorId = user.id;
    } else if (query.authorId) {
      baseWhere.authorId = query.authorId;
    }

    if (isPublished !== undefined) {
      baseWhere.isPublished = isPublished === "true" || isPublished === true;
    }

    if (categorySlug) {
      baseWhere.categorySlug = categorySlug;
    }

    // 优先：按文章 ID 精确查询
    if (articleId) {
      baseWhere.id = articleId;
    }

    // 其次：按 slug 精确查询（忽略大小写）
    if (!articleId && slug) {
      const matchingContents = await prisma.articleContent.findMany({
        where: {
          slug: { equals: slug, mode: "insensitive" },
        },
        select: { articleBaseId: true },
      });
      const matchingBaseIds = [
        ...new Set(matchingContents.map((c) => c.articleBaseId)),
      ];
      if (matchingBaseIds.length > 0) {
        baseWhere.id = { in: matchingBaseIds };
      } else {
        return success({
          items: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }
    }

    // 再次：多关键词搜索（标题/slug 模糊匹配，词与词之间 AND）
    // 如果有搜索条件，先找到匹配的 ArticleContent，获取对应的 ArticleBase IDs
    if (!articleId && !slug && search) {
      const keywords = splitSearchKeywords(search);
      if (keywords.length === 0) {
        return success({
          items: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }

      const matchingContents = await prisma.articleContent.findMany({
        where: buildAllKeywordsMatchWhere(keywords, ["title", "slug"]),
        select: { articleBaseId: true },
      });
      const matchingBaseIds = [
        ...new Set(matchingContents.map((c) => c.articleBaseId)),
      ];
      if (matchingBaseIds.length > 0) {
        baseWhere.id = { in: matchingBaseIds };
      } else {
        return success({
          items: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }
    }

    // 构建排序条件：先按 pinOrder 倒序（置顶靠前），再按用户选择的字段排序
    const validSortFields = ["createdAt", "viewCount", "updatedAt", "pinOrder"];
    const validSortOrders = ["asc", "desc"];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const finalSortOrder = validSortOrders.includes(sortOrder)
      ? sortOrder
      : "desc";

    const orderBy: any[] = [
      { pinOrder: "desc" },
      { [finalSortBy]: finalSortOrder },
    ];

    let articleBases: any[];
    let total: number;

    if (tagSlug) {
      // 按标签筛选：先查出所有符合 baseWhere 的 base，在内存中过滤包含该 tag 的，再排序、分页
      const allBases = await prisma.articleBase.findMany({
        where: baseWhere,
        select: {
          id: true,
          featuredImage: true,
          status: true,
          isPublished: true,
          publishedAt: true,
          viewCount: true,
          pinOrder: true,
          authorId: true,
          categorySlug: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
      });
      const filtered = allBases.filter((base) => {
        if (!base.tags) return false;
        try {
          const slugs = JSON.parse(base.tags) as string[];
          return slugs.includes(tagSlug);
        } catch {
          return false;
        }
      });
      total = filtered.length;
      articleBases = filtered.slice(
        (page - 1) * pageSize,
        page * pageSize
      );
    } else {
      [articleBases, total] = await Promise.all([
        prisma.articleBase.findMany({
          where: baseWhere,
          select: {
            id: true,
            featuredImage: true,
            status: true,
            isPublished: true,
            publishedAt: true,
            viewCount: true,
            pinOrder: true,
            authorId: true,
            categorySlug: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.articleBase.count({
          where: baseWhere,
        }),
      ]);
    }

    if (articleBases.length === 0) {
      return success({
        items: [],
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
      select: {
        id: true,
        articleBaseId: true,
        languageCode: true,
        slug: true,
        title: true,
        content: true,
        excerpt: true,
        seoTitle: true,
        seoDescription: true,
        seoKeyword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 按 articleBaseId 分组，获取每个文章的所有语言代码
    const languageCodesMap = new Map<string, string[]>();
    for (const content of allContents) {
      const existing = languageCodesMap.get(content.articleBaseId) || [];
      if (!existing.includes(content.languageCode)) {
        existing.push(content.languageCode);
      }
      languageCodesMap.set(content.articleBaseId, existing);
    }

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

    // 转换数据格式以兼容前端
    // 收藏数量（按 ArticleBase 统计）
    const bookmarkGroups = await prisma.articleBookmark.groupBy({
      where: {
        articleBaseId: { in: articleBaseIds },
      },
      by: ["articleBaseId"],
      _count: {
        id: true,
      },
    });
    const bookmarkCountMap = new Map<string, number>();
    for (const g of bookmarkGroups) {
      bookmarkCountMap.set(g.articleBaseId, g._count.id);
    }

    const items = articleBases
      .map((base) => {
        const content = contentMap.get(base.id);
        if (!content) return null;

        const tagSlugs = base.tags ? (JSON.parse(base.tags) as string[]) : [];

        return {
          id: base.id,
          contentId: content.id,
          slug: content.slug,
          title: content.title,
          content: content.content,
          excerpt: content.excerpt,
          featuredImage: base.featuredImage,
          status: base.status,
          isPublished: base.isPublished,
          publishedAt: base.publishedAt,
          viewCount: base.viewCount,
          bookmarkCount: bookmarkCountMap.get(base.id) || 0,
          pinOrder: base.pinOrder,
          languageCode: content.languageCode,
          language: {
            code: content.languageCode,
            name: "",
          },
          categorySlug: base.categorySlug,
          tagSlugs,
          authorId: base.authorId,
          seoTitle: content.seoTitle,
          seoDescription: content.seoDescription,
          seoKeyword: content.seoKeyword,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
          availableLanguages: languageCodesMap.get(base.id) || [],
        };
      })
      .filter((item) => item !== null) as any[];

    // 如果需要 language.name，批量查询
    if (items.length > 0) {
      const languageCodes = [
        ...new Set(items.map((item) => item.languageCode)),
      ];
      const languages = await prisma.language.findMany({
        where: { code: { in: languageCodes } },
        select: { code: true, name: true },
      });
      const langMap = new Map(languages.map((lang) => [lang.code, lang.name]));
      items.forEach((item) => {
        item.language.name = langMap.get(item.languageCode) || "";
      });
    }

    return success({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return error(err.message || "获取文章列表失败");
  }
});
