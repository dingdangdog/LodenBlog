import { success, error } from "~~/server/utils/result";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { createError } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const body = await readBody(event);
    const { articleBaseId, content, parentId } = body;

    if (!articleBaseId) {
      return error("文章 ID 不能为空");
    }

    if (!content || !content.trim()) {
      return error("评论内容不能为空");
    }

    if (content.length > 200) {
      return error("评论内容不能超过 200 个字符");
    }

    const articleBase = await prisma.articleBase.findUnique({
      where: { id: articleBaseId },
      select: { id: true, authorId: true },
    });

    if (!articleBase) {
      return error("文章不存在");
    }

    if (articleBase.authorId !== user.id && user.role < ROLE_LEVEL.ADMIN) {
      throw createError({
        statusCode: 403,
        message: "无权限在该文章下回复",
      });
    }

    let finalParentId: string | null = null;
    if (parentId && parentId !== "0") {
      const parent = await prisma.comment.findFirst({
        where: { id: parentId, articleBaseId },
        select: { id: true },
      });
      if (!parent) {
        return error("父评论不存在");
      }
      finalParentId = parentId;
    }

    const author = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, username: true },
    });
    const authorName = author?.name || author?.username || "作者";

    const comment = await prisma.comment.create({
      data: {
        articleBaseId,
        content: content.trim(),
        parentId: finalParentId,
        userId: user.id,
        authorName,
        authorEmail: null,
        authorUrl: null,
        isApproved: true,
      },
      select: {
        id: true,
        content: true,
        authorName: true,
        userId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(
      {
        ...comment,
        user: author ? { id: user.id, name: author.name, username: author.username } : null,
      },
      "回复成功"
    );
  } catch (err: any) {
    return error(err.message || "回复失败");
  }
});
