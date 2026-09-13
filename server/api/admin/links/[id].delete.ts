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

    await prisma.friendLink.delete({
      where: { id },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除友链失败");
  }
});
