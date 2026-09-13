import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { deleteFromR2 } from "~~/server/utils/r2";
import { requireAuth } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("媒体 ID 不能为空");
    }

    const existing = await prisma.media.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("媒体不存在");
    }

    // 检查权限：只能删除自己上传的媒体
    if (existing.uploaderId !== user.id) {
      return error("只能删除自己上传的媒体");
    }

    // 删除 R2 中的文件
    try {
      await deleteFromR2(existing.path);
    } catch (err: any) {
      console.error("删除 R2 文件失败:", err);
      // 继续删除数据库记录，即使 R2 删除失败
    }

    // 删除数据库记录
    await prisma.media.delete({
      where: { id },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除失败");
  }
});
