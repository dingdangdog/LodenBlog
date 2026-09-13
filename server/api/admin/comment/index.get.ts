import { success, error } from "~~/server/utils/result";
import { requireAdmin } from "~~/server/utils/permission";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const query = getQuery(event);
    const isApproved = query.isApproved as string | undefined;
    const search = query.search as string | undefined;
    const articleBaseId = query.articleBaseId as string | undefined;

    const where: any = {};

    if (typeof isApproved !== "undefined" && isApproved !== "") {
      if (isApproved === "true") where.isApproved = true;
      else if (isApproved === "false") where.isApproved = false;
    }

    if (articleBaseId) {
      where.articleBaseId = articleBaseId;
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { authorName: { contains: search, mode: "insensitive" } },
        { authorEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const comments = await prisma.comment.findMany({
      where,
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

    const baseIds = [...new Set(comments.map((c) => c.articleBaseId))];
    const contents =
      baseIds.length > 0
        ? await prisma.articleContent.findMany({
            where: { articleBaseId: { in: baseIds } },
            select: { articleBaseId: true, languageCode: true, title: true },
            orderBy: { languageCode: "asc" },
          })
        : [];

    const titleByBase = new Map<string, string>();
    for (const c of contents) {
      if (!titleByBase.has(c.articleBaseId)) {
        titleByBase.set(c.articleBaseId, c.title);
      }
    }

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
      articleTitle: titleByBase.get(c.articleBaseId) ?? null,
      userId: c.userId,
      parentId: c.parentId,
      user: c.userId ? userMap.get(c.userId) ?? null : null,
    }));

    return success(list, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取评论列表失败");
  }
});
