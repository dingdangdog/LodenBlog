import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { isAiProvider } from "~~/server/utils/provider-kind";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("翻译配置 ID 不能为空");
    }

    const body = await readBody(event);
    const {
      name,
      provider,
      apiKey,
      apiSecret,
      apiEndpoint,
      timeout,
      maxRetries,
      priority,
      extraConfig,
      isActive,
    } = body;

    const existing = await prisma.translationConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("翻译配置不存在");
    }

    // 验证必填字段（如果提供）
    if (name !== undefined && (!name || !name.trim())) {
      return error("配置名称不能为空");
    }

    if (provider !== undefined && (!provider || !provider.trim())) {
      return error("服务商标识不能为空");
    }

    if (provider !== undefined && isAiProvider(provider)) {
      return error("该协议属于 AI 服务商，请到 AI 配置中管理");
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (provider !== undefined) updateData.provider = provider.trim();
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (apiSecret !== undefined) updateData.apiSecret = apiSecret;
    if (apiEndpoint !== undefined) updateData.apiEndpoint = apiEndpoint;
    if (timeout !== undefined) updateData.timeout = timeout;
    if (maxRetries !== undefined) updateData.maxRetries = maxRetries;
    if (priority !== undefined) updateData.priority = priority;
    if (extraConfig !== undefined) updateData.extraConfig = extraConfig;
    if (isActive !== undefined) updateData.isActive = isActive;

    const config = await prisma.translationConfig.update({
      where: { id },
      data: updateData,
    });

    return success({ config }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新翻译配置失败");
  }
});

