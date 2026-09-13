import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("AI配置 ID 不能为空");
    }

    const existing = await prisma.aiConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("AI配置不存在");
    }

    await prisma.aiConfig.delete({
      where: { id },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除AI配置失败");
  }
});
