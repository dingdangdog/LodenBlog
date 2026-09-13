import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    // 需要创作者或管理员权限
    const user = await requireCreator(event);

    const body = await readBody(event);
    let { slug } = body;
    const {
      title,
      content,
      excerpt,
      featuredImage,
      languageCode,
      categorySlug,
      tagSlugs,
      seoTitle,
      seoDescription,
      seoKeyword,
      status = "DRAFT",
      isPublished = false,
    } = body;

    // slug 统一转为小写
    if (slug) {
      slug = String(slug).toLowerCase();
    }

    if (!slug || !title || !content) {
      return error("slug、title 和 content 不能为空");
    }

    // 获取语言代码
    if (!languageCode) {
      return error("languageCode 不能为空");
    }

    // 验证语言代码是否存在
    const language = await prisma.language.findUnique({
      where: { code: languageCode },
      select: { code: true },
    });
    if (!language) {
      return error("语言不存在");
    }

    const finalLanguageCode = languageCode;

    // 检查 slug 和 languageCode 的唯一性
    const existing = await prisma.articleContent.findFirst({
      where: {
        slug,
        languageCode: finalLanguageCode,
      },
    });

    if (existing) {
      return error("该语言下已存在相同 slug 的文章");
    }

    // 验证分类（categorySlug 是跨语言共享的，只验证 slug 是否存在，不按语言验证）
    if (categorySlug) {
      const category = await prisma.category.findFirst({
        where: {
          slug: categorySlug,
          isActive: true,
        },
        select: { slug: true },
      });
      if (!category) {
        return error("分类不存在");
      }
    }

    // 验证标签（tagSlugs 是跨语言共享的，只验证 slug 是否存在，不按语言验证）
    if (tagSlugs && Array.isArray(tagSlugs) && tagSlugs.length > 0) {
      const validTags = await prisma.tag.findMany({
        where: {
          slug: { in: tagSlugs },
        },
        select: { slug: true },
        distinct: ["slug"],
      });
      const validSlugs = validTags.map((t) => t.slug);
      const invalidSlugs = tagSlugs.filter((s) => !validSlugs.includes(s));
      if (invalidSlugs.length > 0) {
        return error(`以下标签不存在: ${invalidSlugs.join(", ")}`);
      }
    }

    // 使用事务创建 ArticleBase 和 ArticleContent
    const result = await prisma.$transaction(async (tx) => {
      // 创建 ArticleBase
      const articleBase = await tx.articleBase.create({
        data: {
          featuredImage:
            (typeof featuredImage === "string"
              ? featuredImage.trim()
              : featuredImage) || null,
          status,
          isPublished,
          publishedAt: isPublished ? new Date() : null,
          authorId: user.id,
          categorySlug: categorySlug || null,
          tags:
            tagSlugs && Array.isArray(tagSlugs) && tagSlugs.length > 0
              ? JSON.stringify(tagSlugs)
              : null,
        },
      });

      // 创建 ArticleContent
      const articleContent = await tx.articleContent.create({
        data: {
          articleBaseId: articleBase.id,
          languageCode: finalLanguageCode,
          slug,
          title,
          content,
          excerpt: excerpt || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          seoKeyword: seoKeyword || null,
        },
      });

      // 解析tags
      const tagSlugsArray = articleBase.tags
        ? (JSON.parse(articleBase.tags) as string[])
        : [];

      return {
        id: articleBase.id,
        contentId: articleContent.id,
        slug: articleContent.slug,
        title: articleContent.title,
        content: articleContent.content,
        excerpt: articleContent.excerpt,
        featuredImage: articleBase.featuredImage,
        status: articleBase.status,
        isPublished: articleBase.isPublished,
        publishedAt: articleBase.publishedAt,
        languageCode: articleContent.languageCode,
        categorySlug: articleBase.categorySlug,
        tagSlugs: tagSlugsArray,
        authorId: articleBase.authorId,
        seoTitle: articleContent.seoTitle,
        seoDescription: articleContent.seoDescription,
        seoKeyword: articleContent.seoKeyword,
        createdAt: articleBase.createdAt,
        updatedAt: articleBase.updatedAt,
      };
    });

    return success({ article: result }, "创建成功");
  } catch (err: any) {
    return error(err.message || "创建文章失败");
  }
});
