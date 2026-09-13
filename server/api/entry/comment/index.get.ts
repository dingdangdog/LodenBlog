import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const articleBaseId = query.articleBaseId as string;
    const parentId = query.parentId as string | undefined; // 如果提供，则查询子评论；否则查询根评论
    const page = Math.max(parseInt((query.page as string) || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt((query.pageSize as string) || "10", 10), 1),
      50
    );

    if (!articleBaseId) {
      return error("文章ID不能为空");
    }

    // 验证文章是否存在
    const articleBase = await prisma.articleBase.findUnique({
      where: { id: articleBaseId },
      select: { id: true },
    });

    if (!articleBase) {
      return error("文章不存在");
    }

    // 构建查询条件
    const where: any = {
      articleBaseId,
      isApproved: true, // 只返回已审核通过的评论
    };

    // 如果提供了parentId，查询子评论；否则查询根评论（parentId为null或"0"）
    if (parentId !== undefined) {
      if (parentId === "0" || parentId === null || parentId === "") {
        // 查询根评论
        where.parentId = null;
      } else {
        // 查询指定父评论的子评论
        where.parentId = parentId;
      }
    } else {
      // 默认查询根评论
      where.parentId = null;
    }

    // 查询总数
    const total = await prisma.comment.count({ where });

    // 查询评论列表（按时间升序，老的在前）
    const comments = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        content: true,
        authorName: true,
        authorEmail: true,
        authorUrl: true,
        userId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 查询每个评论的子评论数量（用于判断是否显示"展开讨论"）
    const commentIds = comments.map((c) => c.id);
    const childCounts = await prisma.comment.groupBy({
      by: ["parentId"],
      where: {
        parentId: { in: commentIds },
        isApproved: true,
      },
      _count: true,
    });

    const childCountMap = new Map(
      childCounts.map((item) => [item.parentId, item._count])
    );

    // 如果查询的是根评论，还需要查询用户信息
    const userIds = comments
      .map((c) => c.userId)
      .filter((id): id is string => id !== null);
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    // 组装返回数据
    const items = comments.map((comment) => {
      const user = comment.userId ? userMap.get(comment.userId) : null;
      return {
        id: comment.id,
        content: comment.content,
        authorName: user?.name || comment.authorName,
        authorEmail: comment.authorEmail,
        authorUrl: comment.authorUrl,
        userId: comment.userId,
        parentId: comment.parentId,
        avatar: user?.avatar || null,
        username: user?.username || null,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        childCount: childCountMap.get(comment.id) || 0, // 子评论数量
      };
    });

    return success({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    });
  } catch (err: any) {
    return error(err.message || "获取评论失败");
  }
});
