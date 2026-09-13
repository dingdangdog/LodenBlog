import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    // 一次性查询所有语言的分类和标签
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        languageCode: true,
      },
    });

    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        color: true,
        languageCode: true,
      },
    });

    // 构建字典结构：按languageCode分组
    const categoryDict: Record<string, Record<string, any>> = {};
    const tagDict: Record<string, Record<string, any>> = {};

    categories.forEach((cat) => {
      if (!categoryDict[cat.languageCode]) {
        categoryDict[cat.languageCode] = {};
      }
      categoryDict[cat.languageCode][cat.slug] = {
        name: cat.name,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
      };
    });

    tags.forEach((tag) => {
      if (!tagDict[tag.languageCode]) {
        tagDict[tag.languageCode] = {};
      }
      tagDict[tag.languageCode][tag.slug] = {
        name: tag.name,
        color: tag.color,
      };
    });

    return success({
      categories: categoryDict,
      tags: tagDict,
    });
  } catch (err: any) {
    return error(err.message || "获取字典数据失败");
  }
});

