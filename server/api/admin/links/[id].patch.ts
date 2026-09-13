import { success, error } from "~~/server/utils/result";
import { requireAdmin } from "~~/server/utils/permission";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const id = getRouterParam(event, "id");
    if (!id) {
      return error("友链 ID 不能为空");
    }

    const existing = await prisma.friendLink.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("友链不存在");
    }

    const body = await readBody(event);
    const { icon, url, name, description, isActive, sortOrder } = body;

    const updateData: any = {};
    if (icon !== undefined) updateData.icon = icon || null;
    if (url !== undefined) updateData.url = url.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (typeof sortOrder === "number") updateData.sortOrder = sortOrder;

    if (Object.keys(updateData).length === 0) {
      return success({ link: existing }, "无变更");
    }

    if (updateData.url !== undefined && !updateData.url) {
      return error("目标链接不能为空");
    }
    if (updateData.name !== undefined && !updateData.name) {
      return error("名称不能为空");
    }

    const link = await prisma.friendLink.update({
      where: { id },
      data: updateData,
    });

    return success({ link }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新友链失败");
  }
});
