import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      slug,
      name,
      description,
      color,
      icon,
      sortOrder,
      isActive,
      languageCode,
      parentId,
    } = body;

    if (!slug || !name || !languageCode) {
      return error("Slug、名称和语言代码不能为空");
    }

    const existing = await prisma.category.findUnique({
      where: {
        slug_languageCode: {
          slug,
          languageCode,
        },
      },
    });

    if (existing) {
      return error("该语言下已存在相同Slug的分类");
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return error("父分类不存在");
      }

      if (parent.languageCode !== languageCode) {
        return error("父分类必须与当前分类使用相同的语言");
      }
    }

    const category = await prisma.category.create({
      data: {
        slug,
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        languageCode,
        parentId: parentId || null,
      },
    });

    return success({ category }, "创建成功");
  } catch (err: any) {
    return error(err.message || "创建分类失败");
  }
});
