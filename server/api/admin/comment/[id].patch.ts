import { success, error } from "~~/server/utils/result";
import { requireAdmin } from "~~/server/utils/permission";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const id = getRouterParam(event, "id");
    if (!id) {
      return error("评论 ID 不能为空");
    }

    const body = await readBody(event);
    const { isApproved, content } = body;

    const existing = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("评论不存在");
    }

    const updateData: any = {};
    if (typeof isApproved === "boolean") updateData.isApproved = isApproved;
    if (typeof content === "string") updateData.content = content;

    if (Object.keys(updateData).length === 0) {
      return success({ comment: existing }, "无变更");
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: updateData,
    });

    return success({ comment }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新评论失败");
  }
});
