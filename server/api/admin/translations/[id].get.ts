import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("翻译配置 ID 不能为空");
    }

    const config = await prisma.translationConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return error("翻译配置不存在");
    }

    return success(config, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取翻译配置失败");
  }
});

