import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("翻译配置 ID 不能为空");
    }

    const existing = await prisma.translationConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("翻译配置不存在");
    }

    await prisma.translationConfig.delete({
      where: { id },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除翻译配置失败");
  }
});
