import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

/**
 * 管理端：更新信息页基础（InfoBase）的 hidden、sortOrder、slug
 */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("ID 不能为空");
    }

    const body = await readBody(event);
    const { hidden, sortOrder, slug } = body;

    const updateData: { hidden?: boolean; sortOrder?: number; slug?: string } = {};
    if (typeof hidden === "boolean") updateData.hidden = hidden;
    if (typeof sortOrder === "number") updateData.sortOrder = sortOrder;
    if (typeof slug === "string" && slug.trim()) updateData.slug = slug.trim();

    if (Object.keys(updateData).length === 0) {
      const existing = await prisma.infoBase.findUnique({ where: { id } });
      return success(existing ?? null, "无变更");
    }

    const updated = await prisma.infoBase.update({
      where: { id },
      data: updateData,
    });

    return success(updated, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新失败");
  }
});
