import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("标签 ID 不能为空");
    }

    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return error("标签不存在");
    }

    // 检查是否有文章使用此标签（ArticleBase.tags 为 JSON 数组的 slug）
    const articles = await prisma.articleBase.findMany({
      where: { tags: { not: null } },
      select: { id: true, tags: true },
    });
    const hasUsage = articles.some((a) => {
      if (!a.tags) return false;
      try {
        const slugs = JSON.parse(a.tags) as string[];
        return slugs.includes(tag.slug);
      } catch {
        return false;
      }
    });
    if (hasUsage) {
      return error("该标签下还有文章，无法删除");
    }

    await prisma.tag.delete({
      where: { id },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除标签失败");
  }
});
