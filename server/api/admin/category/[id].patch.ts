import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("分类 ID 不能为空");
    }

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

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("分类不存在");
    }

    if (slug && slug !== existing.slug) {
      // 检查新 slug 在当前语言下是否已存在
      const duplicate = await prisma.category.findUnique({
        where: {
          slug_languageCode: {
            slug,
            languageCode: languageCode || existing.languageCode,
          },
        },
      });

      if (duplicate) {
        return error("该语言下已存在相同Slug的分类");
      }

      // 检查新 slug 在其他语言下是否已存在（排除当前分类）
      const duplicateInOtherLang = await prisma.category.findFirst({
        where: {
          slug,
          id: {
            not: id,
          },
        },
      });

      if (duplicateInOtherLang) {
        return error(
          `新 slug "${slug}" 在其他语言（${duplicateInOtherLang.languageCode}）下已存在`
        );
      }
    }

    if (parentId) {
      if (parentId === id) {
        return error("不能将自己设为父分类");
      }

      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return error("父分类不存在");
      }

      const finalLanguageCode = languageCode || existing.languageCode;
      if (parent.languageCode !== finalLanguageCode) {
        return error("父分类必须与当前分类使用相同的语言");
      }
    }

    const updateData: any = {};
    if (slug !== undefined) updateData.slug = slug;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (languageCode !== undefined) updateData.languageCode = languageCode;
    if (parentId !== undefined) updateData.parentId = parentId;

    // 如果修改了slug，需要同步更新所有使用该分类的文章
    const oldSlug = existing.slug;
    const newSlug = slug !== undefined ? slug : oldSlug;
    const slugChanged = slug !== undefined && slug !== oldSlug;

    // 需要同步到所有相同 slug 分类的字段（不包括 name 和 description，它们应该保持各语言独立）
    const syncData: any = {};
    if (color !== undefined) syncData.color = color;
    if (icon !== undefined) syncData.icon = icon;
    if (sortOrder !== undefined) syncData.sortOrder = sortOrder;
    if (isActive !== undefined) syncData.isActive = isActive;
    if (slugChanged) syncData.slug = newSlug;

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新当前分类
      const category = await tx.category.update({
        where: { id },
        data: updateData,
      });

      // 如果slug改变了，同步更新所有使用该分类的文章
      if (slugChanged) {
        await tx.articleBase.updateMany({
          where: {
            categorySlug: oldSlug,
          },
          data: {
            categorySlug: newSlug,
          },
        });
      }

      // 同步更新所有相同 slug 的其他语言分类（排除当前分类）
      if (Object.keys(syncData).length > 0) {
        await tx.category.updateMany({
          where: {
            slug: oldSlug,
            id: {
              not: id,
            },
          },
          data: syncData,
        });
      }

      return category;
    });

    return success({ category: result }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新分类失败");
  }
});
