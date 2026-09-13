import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    await requireCreator(event);
    const body = await readBody(event);
    const { name, slug, languageCode, description, color, icon, sortOrder } =
      body;

    if (!name || !slug || !languageCode) {
      return error("name、slug 和 languageCode 不能为空");
    }

    // 验证slug格式
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return error("slug 只能包含小写字母、数字和连字符");
    }

    // 检查 slug 和 languageCode 的唯一性
    const existing = await prisma.category.findUnique({
      where: {
        slug_languageCode: {
          slug,
          languageCode,
        },
      },
    });

    if (existing) {
      return error("该语言下已存在相同slug的分类");
    }

    // 创建分类
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        languageCode,
        description: description || null,
        color: color || null,
        icon: icon || null,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        languageCode: true,
      },
    });

    return success({ category }, "分类创建成功");
  } catch (err: any) {
    return error(err.message || "创建分类失败");
  }
});
