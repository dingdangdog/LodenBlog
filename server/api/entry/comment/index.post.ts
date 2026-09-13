import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { getCurrentUser } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      articleBaseId,
      content,
      parentId,
      authorName,
      authorEmail,
      authorUrl,
    } = body;

    // 验证必填字段
    if (!articleBaseId) {
      return error("文章ID不能为空");
    }

    if (!content || !content.trim()) {
      return error("评论内容不能为空");
    }

    // 验证评论内容长度（最多200字符）
    if (content.length > 200) {
      return error("评论内容不能超过200个字符");
    }

    // 验证文章是否存在
    const articleBase = await prisma.articleBase.findUnique({
      where: { id: articleBaseId },
      select: { id: true, isPublished: true },
    });

    if (!articleBase) {
      return error("文章不存在");
    }

    if (!articleBase.isPublished) {
      return error("文章未发布，无法评论");
    }

    // 获取当前用户（可选，未登录用户也可以评论）
    const currentUser = await getCurrentUser(event);
    const userId = currentUser?.id || null;

    // 如果用户已登录，查询用户信息
    let user = null;
    let finalAuthorName = "";
    let finalAuthorEmail: string | null = null;

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      });
      // 登录用户使用用户的name或username作为authorName
      finalAuthorName = user?.name || user?.username || "用户";
      finalAuthorEmail = null; // 登录用户不需要存储邮箱
    } else {
      // 如果用户未登录，必须提供作者信息
      if (!authorName || !authorName.trim()) {
        return error("未登录用户必须提供姓名");
      }
      if (!authorEmail || !authorEmail.trim()) {
        return error("未登录用户必须提供邮箱");
      }
      // 简单的邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(authorEmail)) {
        return error("邮箱格式不正确");
      }
      finalAuthorName = authorName.trim();
      finalAuthorEmail = authorEmail.trim();
    }

    // 如果提供了parentId，验证父评论是否存在
    let finalParentId: string | null = null;
    if (parentId) {
      if (parentId === "0" || parentId === null || parentId === "") {
        // 根评论
        finalParentId = null;
      } else {
        // 验证父评论是否存在且属于同一文章
        const parentComment = await prisma.comment.findFirst({
          where: {
            id: parentId,
            articleBaseId,
          },
          select: { id: true },
        });

        if (!parentComment) {
          return error("父评论不存在");
        }
        finalParentId = parentId;
      }
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        articleBaseId,
        content: content.trim(),
        parentId: finalParentId,
        userId,
        authorName: finalAuthorName, // 登录用户使用用户信息，未登录用户使用提供的姓名
        authorEmail: finalAuthorEmail, // 未登录用户需要邮箱，登录用户为null
        authorUrl: authorUrl?.trim() || null,
        isApproved: true, // 默认自动审核通过，后续可以改为需要审核
      },
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

    // 组装返回数据
    const result = {
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
      childCount: 0, // 新评论没有子评论
    };

    return success(result, "评论提交成功");
  } catch (err: any) {
    return error(err.message || "提交评论失败");
  }
});
