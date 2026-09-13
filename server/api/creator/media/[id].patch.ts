import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireAuth } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("媒体 ID 不能为空");
    }

    const body = await readBody(event);
    const { alt, caption } = body;

    const existing = await prisma.media.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("媒体不存在");
    }

    // 检查权限：只能编辑自己上传的媒体
    if (existing.uploaderId !== user.id) {
      return error("只能编辑自己上传的媒体");
    }

    const updateData: any = {};
    if (alt !== undefined) updateData.alt = alt || null;
    if (caption !== undefined) updateData.caption = caption || null;

    const media = await prisma.media.update({
      where: { id },
      data: updateData,
    });

    return success(media, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新失败");
  }
});
