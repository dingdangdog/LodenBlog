import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("分类 ID 不能为空");
    }

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return error("分类不存在");
    }

    // 检查是否有子分类
    const childrenCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      return error("该分类下还有子分类，无法删除");
    }

    // 检查是否有文章使用此分类
    const articleCount = await prisma.articleBase.count({
      where: { categorySlug: category.slug },
    });

    if (articleCount > 0) {
      return error("该分类下还有文章，无法删除");
    }

    await prisma.category.delete({
      where: { id },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除分类失败");
  }
});
