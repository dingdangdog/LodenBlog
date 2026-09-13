import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { type = "all" } = body;

    const result: any = {};

    const languages = await prisma.language.findMany({
      where: { isActive: true },
    });

    if (languages.length === 0) {
      return error("请先初始化语言数据");
    }

    if (type === "all" || type === "categories") {
      const categoryData = [
        {
          slug: "technology",
          names: {
            zh: "技术",
            en: "Technology",
            ja: "テクノロジー",
          },
          descriptions: {
            zh: "技术相关文章",
            en: "Technology related articles",
            ja: "技術関連の記事",
          },
        },
        {
          slug: "lifestyle",
          names: {
            zh: "生活",
            en: "Lifestyle",
            ja: "ライフスタイル",
          },
          descriptions: {
            zh: "生活方式相关文章",
            en: "Lifestyle related articles",
            ja: "ライフスタイル関連の記事",
          },
        },
      ];

      const createdCategories = [];
      for (const cat of categoryData) {
        for (const lang of languages) {
          const existing = await prisma.category.findFirst({
            where: {
              slug: cat.slug,
              languageCode: lang.code,
            },
          });

          if (!existing) {
            const created = await prisma.category.create({
              data: {
                slug: cat.slug,
                name: cat.names[lang.code as keyof typeof cat.names] || cat.names.en,
                description: cat.descriptions[lang.code as keyof typeof cat.descriptions] || cat.descriptions.en,
                languageCode: lang.code,
                isActive: true,
                sortOrder: createdCategories.length,
              },
            });
            createdCategories.push(created);
          }
        }
      }

      result.categories = createdCategories.length;
    }

    if (type === "all" || type === "tags") {
      const tagData = [
        { slug: "tutorial", names: { zh: "教程", en: "Tutorial", ja: "チュートリアル" } },
        { slug: "guide", names: { zh: "指南", en: "Guide", ja: "ガイド" } },
        { slug: "news", names: { zh: "新闻", en: "News", ja: "ニュース" } },
      ];

      const createdTags = [];
      for (const tag of tagData) {
        for (const lang of languages) {
          const existing = await prisma.tag.findFirst({
            where: {
              slug: tag.slug,
              languageCode: lang.code,
            },
          });

          if (!existing) {
            const created = await prisma.tag.create({
              data: {
                slug: tag.slug,
                name: tag.names[lang.code as keyof typeof tag.names] || tag.names.en,
                languageCode: lang.code,
              },
            });
            createdTags.push(created);
          }
        }
      }

      result.tags = createdTags.length;
    }

    return success(result, "种子数据初始化成功");
  } catch (err: any) {
    return error(err.message || "种子数据初始化失败");
  }
});

