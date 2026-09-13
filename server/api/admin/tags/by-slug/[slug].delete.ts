import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

/**
 * DELETE /api/admin/tags/by-slug/:slug
 * 按 slug 批量删除该标签的全部语种
 */
export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, "slug");
    if (!slug) {
      return error("标签 slug 不能为空");
    }

    const tags = await prisma.tag.findMany({
      where: { slug },
      select: { id: true },
    });

    if (tags.length === 0) {
      return error("该 slug 下没有标签");
    }

    // 检查是否有文章使用此 slug
    const articles = await prisma.articleBase.findMany({
      where: { tags: { not: null } },
      select: { id: true, tags: true },
    });
    const hasUsage = articles.some((a) => {
      if (!a.tags) return false;
      try {
        const slugs = JSON.parse(a.tags) as string[];
        return slugs.includes(slug);
      } catch {
        return false;
      }
    });
    if (hasUsage) {
      return error("该标签下还有文章，无法删除");
    }

    await prisma.tag.deleteMany({
      where: { slug },
    });

    return success({ deleted: tags.length }, "已删除该标签的全部语种");
  } catch (err: any) {
    return error(err.message || "按 slug 删除标签失败");
  }
});
