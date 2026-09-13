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

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return error("评论不存在");
    }

    await prisma.comment.delete({
      where: { id },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除评论失败");
  }
});
