import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

/**
 * 管理端：删除信息页（InfoBase）及其全部语言内容
 */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("ID 不能为空");
    }

    await prisma.$transaction([
      prisma.infoContent.deleteMany({ where: { infoBaseId: id } }),
      prisma.infoBase.delete({ where: { id } }),
    ]);

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除失败");
  }
});
