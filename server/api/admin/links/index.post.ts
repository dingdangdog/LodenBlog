import { success, error } from "~~/server/utils/result";
import { requireAdmin } from "~~/server/utils/permission";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const body = await readBody(event);
    const { icon, url, name, description, isActive, sortOrder } = body;

    if (!name || !url) {
      return error("名称和目标链接不能为空");
    }

    const link = await prisma.friendLink.create({
      data: {
        icon: icon || null,
        url: url.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? !!isActive : true,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      },
    });

    return success({ link }, "创建成功");
  } catch (err: any) {
    return error(err.message || "创建友链失败");
  }
});
