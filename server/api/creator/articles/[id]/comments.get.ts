import { success, error } from "~~/server/utils/result";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";
import { createError } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const articleBaseId = getRouterParam(event, "id");

    if (!articleBaseId) {
      return error("文章 ID 不能为空");
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
        message: "无权限访问该文章的评论",
      });
    }

    const comments = await prisma.comment.findMany({
      where: { articleBaseId },
      orderBy: [{ createdAt: "desc" }],
    });

    const userIds = [...new Set(comments.map((c) => c.userId).filter(Boolean))] as string[];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, name: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const list = comments.map((c) => ({
      id: c.id,
      content: c.content,
      authorName: c.authorName,
      authorEmail: c.authorEmail,
      authorUrl: c.authorUrl,
      isApproved: c.isApproved,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      articleBaseId: c.articleBaseId,
      userId: c.userId,
      parentId: c.parentId,
      user: c.userId ? userMap.get(c.userId) ?? null : null,
    }));

    return success(list, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取评论列表失败");
  }
});
