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

    const config = await prisma.aiConfig.create({
      data: {
        name: `${existing.name} copy`,
        provider: existing.provider,
        apiKey: existing.apiKey,
        apiSecret: existing.apiSecret,
        apiEndpoint: existing.apiEndpoint,
        timeout: existing.timeout,
        maxRetries: existing.maxRetries,
        priority: existing.priority,
        extraConfig: existing.extraConfig,
        isActive: existing.isActive,
      },
    });

    return success(config, "复制成功");
  } catch (err: any) {
    return error(err.message || "复制AI配置失败");
  }
});
