import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

/**
 * 管理端：更新单条信息内容（InfoContent）
 */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("内容 ID 不能为空");
    }

    const body = await readBody(event);
    const { title, content } = body;

    const existing = await prisma.infoContent.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("信息内容不存在");
    }

    const updateData: { title?: string; content?: string } = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    if (Object.keys(updateData).length === 0) {
      return success(existing, "无变更");
    }

    const updated = await prisma.infoContent.update({
      where: { id },
      data: updateData,
    });

    return success(updated, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新信息内容失败");
  }
});
