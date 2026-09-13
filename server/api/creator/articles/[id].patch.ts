import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  try {
    // 需要创作者权限
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");

    if (!id) {
      return error("文章 ID 不能为空");
    }

    // 检查 ArticleBase 是否存在
    const articleBase = await prisma.articleBase.findUnique({
      where: { id },
    });

    if (!articleBase) {
      return error("文章不存在");
    }

    // 检查是否是作者或管理员
    if (articleBase.authorId !== user.id && user.role < ROLE_LEVEL.ADMIN) {
      throw createError({
        statusCode: 403,
        message: "无权限修改此文章",
      });
    }

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
      status,
      isPublished,
      contentId, // 如果提供了 contentId，更新指定的 ArticleContent
    } = body;

    // slug 统一转为小写
    if (slug) {
      slug = String(slug).toLowerCase();
    }

    // 使用 languageCode
    const finalLanguageCode = languageCode;

    // 查找要更新的 ArticleContent
    let articleContent;
    if (contentId) {
      articleContent = await prisma.articleContent.findUnique({
        where: { id: contentId },
      });
      if (!articleContent || articleContent.articleBaseId !== id) {
        return error("文章内容不存在或不属于该文章");
      }
    } else if (finalLanguageCode) {
      articleContent = await prisma.articleContent.findFirst({
        where: {
          articleBaseId: id,
          languageCode: finalLanguageCode,
        },
      });
    } else {
      // 如果没有指定语言，使用第一个内容版本
      articleContent = await prisma.articleContent.findFirst({
        where: { articleBaseId: id },
        orderBy: { createdAt: "asc" },
      });
    }

    // 确定用于验证的语言代码（优先使用finalLanguageCode，否则使用articleContent的languageCode）
    const validationLanguageCode =
      finalLanguageCode || articleContent?.languageCode || "";

    // 验证分类（categorySlug 是跨语言共享的，只验证 slug 是否存在，不按语言验证）
    if (categorySlug !== undefined && categorySlug) {
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
    if (
      tagSlugs !== undefined &&
      Array.isArray(tagSlugs) &&
      tagSlugs.length > 0
    ) {
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

    // 使用事务更新
    const result = await prisma.$transaction(async (tx) => {
      // 更新 ArticleBase
      const baseUpdateData: any = {};
      if (featuredImage !== undefined) {
        const next =
          typeof featuredImage === "string" ? featuredImage.trim() : featuredImage;
        baseUpdateData.featuredImage = next || null;
      }
      if (categorySlug !== undefined) {
        baseUpdateData.categorySlug = categorySlug || null;
      }
      if (status !== undefined) baseUpdateData.status = status;
      if (isPublished !== undefined) {
        baseUpdateData.isPublished = isPublished;
        if (isPublished && !articleBase.publishedAt) {
          baseUpdateData.publishedAt = new Date();
        } else if (!isPublished) {
          baseUpdateData.publishedAt = null;
        }
      }
      if (tagSlugs !== undefined) {
        baseUpdateData.tags =
          Array.isArray(tagSlugs) && tagSlugs.length > 0
            ? JSON.stringify(tagSlugs)
            : null;
      }

      let updatedBase = articleBase;
      if (Object.keys(baseUpdateData).length > 0) {
        updatedBase = await tx.articleBase.update({
          where: { id },
          data: baseUpdateData,
        });
      }

      // 更新或创建 ArticleContent
      let updatedContent;
      if (articleContent) {
        // 如果修改了 slug，需要统一更新该 ArticleBase 下所有语言版本的 slug
        if (slug && slug !== articleContent.slug) {
          // 获取该 ArticleBase 下的所有 ArticleContent
          const allContents = await tx.articleContent.findMany({
            where: {
              articleBaseId: id,
            },
            select: {
              id: true,
              languageCode: true,
              slug: true,
            },
          });

          // 检查新 slug 在所有语言版本下的唯一性
          for (const content of allContents) {
            const duplicate = await tx.articleContent.findFirst({
              where: {
                slug,
                languageCode: content.languageCode,
                NOT: { id: content.id },
              },
            });

            if (duplicate) {
              throw new Error(
                `语言 ${content.languageCode} 下已存在相同 slug 的文章`
              );
            }
          }

          // 统一更新所有语言版本的 slug
          await tx.articleContent.updateMany({
            where: {
              articleBaseId: id,
            },
            data: {
              slug: slug,
            },
          });
        }

        const contentUpdateData: any = {};
        // 如果 slug 已通过 updateMany 更新，这里不再单独更新
        // 只更新其他字段
        if (title !== undefined) contentUpdateData.title = title;
        if (content !== undefined) contentUpdateData.content = content;
        if (excerpt !== undefined) contentUpdateData.excerpt = excerpt;
        if (seoTitle !== undefined) contentUpdateData.seoTitle = seoTitle;
        if (seoDescription !== undefined)
          contentUpdateData.seoDescription = seoDescription;
        if (seoKeyword !== undefined) contentUpdateData.seoKeyword = seoKeyword;
        if (
          finalLanguageCode &&
          finalLanguageCode !== articleContent.languageCode
        ) {
          contentUpdateData.languageCode = finalLanguageCode;
        }

        if (Object.keys(contentUpdateData).length > 0) {
          updatedContent = await tx.articleContent.update({
            where: { id: articleContent.id },
            data: contentUpdateData,
          });
        } else {
          // 即使没有其他字段更新，也需要重新获取以获取最新的 slug（如果已更新）
          updatedContent = await tx.articleContent.findUnique({
            where: { id: articleContent.id },
          });
        }
      } else {
        // 创建新的 ArticleContent（如果提供了所有必需字段）
        if (!slug || !title || !content || !finalLanguageCode) {
          throw new Error(
            "创建新语言版本需要提供 slug、title、content 和 languageCode"
          );
        }

        // 检查 slug 唯一性
        const duplicate = await tx.articleContent.findFirst({
          where: {
            slug,
            languageCode: finalLanguageCode,
          },
        });

        if (duplicate) {
          throw new Error("该语言下已存在相同 slug 的文章");
        }

        updatedContent = await tx.articleContent.create({
          data: {
            articleBaseId: id,
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
      }

      // 解析tags
      const tagSlugsArray = updatedBase.tags
        ? (JSON.parse(updatedBase.tags) as string[])
        : [];

      return {
        id: updatedBase.id,
        contentId: updatedContent.id,
        slug: updatedContent.slug,
        title: updatedContent.title,
        content: updatedContent.content,
        excerpt: updatedContent.excerpt,
        featuredImage: updatedBase.featuredImage,
        status: updatedBase.status,
        isPublished: updatedBase.isPublished,
        publishedAt: updatedBase.publishedAt,
        languageCode: updatedContent.languageCode,
        categorySlug: updatedBase.categorySlug,
        tagSlugs: tagSlugsArray,
        authorId: updatedBase.authorId,
        seoTitle: updatedContent.seoTitle,
        seoDescription: updatedContent.seoDescription,
        seoKeyword: updatedContent.seoKeyword,
        createdAt: updatedBase.createdAt,
        updatedAt: updatedBase.updatedAt,
      };
    });

    return success({ article: result }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新文章失败");
  }
});
