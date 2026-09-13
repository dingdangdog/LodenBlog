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
        message: "无权限删除此文章",
      });
    }

    // 使用事务删除文章及其所有内容版本
    await prisma.$transaction(async (tx) => {
      // 删除所有语言版本的内容
      await tx.articleContent.deleteMany({
        where: { articleBaseId: id },
      });

      // 删除文章基础信息
      await tx.articleBase.delete({
        where: { id },
      });
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除文章失败");
  }
});
