import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("语言 ID 不能为空");
    }

    const existing = await prisma.language.findUnique({
      where: { id },
    });

    if (existing.isDefault) {
      return error("不能删除默认语言");
    }

    const language = await prisma.language.findUnique({
      where: { id },
    });

    if (!language) {
      return error("语言不存在");
    }

    const articleCount = await prisma.articleContent.count({
      where: { languageCode: language.code },
    });

    if (articleCount > 0) {
      return error("该语言下还有文章，无法删除");
    }

    await prisma.category.deleteMany({
      where: { languageCode: language.code },
    });

    await prisma.tag.deleteMany({
      where: { languageCode: language.code },
    });

    await prisma.language.delete({
      where: { id },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除语言失败");
  }
});
