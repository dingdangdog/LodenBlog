import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { isAiProvider } from "~~/server/utils/provider-kind";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      name,
      provider,
      apiKey,
      apiSecret,
      apiEndpoint,
      timeout = 30000,
      maxRetries = 3,
      priority = 0,
      extraConfig,
      isActive = true,
    } = body;

    // 验证必填字段
    if (!name || !name.trim()) {
      return error("配置名称不能为空");
    }

    if (!provider || !provider.trim()) {
      return error("服务商标识不能为空");
    }

    if (isAiProvider(provider)) {
      return error("该协议属于 AI 服务商，请到 AI 配置中添加");
    }

    // 验证数值字段
    if (timeout !== undefined && (timeout < 0 || !Number.isInteger(timeout))) {
      return error("超时时间必须是非负整数");
    }

    if (
      maxRetries !== undefined &&
      (maxRetries < 0 || !Number.isInteger(maxRetries))
    ) {
      return error("最大重试次数必须是非负整数");
    }

    if (
      priority !== undefined &&
      (!Number.isInteger(priority) || priority < 0)
    ) {
      return error("优先级必须是非负整数");
    }

    // 验证 extraConfig 是否为有效的 JSON（如果提供）
    let parsedExtraConfig = null;
    if (extraConfig && extraConfig.trim()) {
      try {
        parsedExtraConfig = JSON.parse(extraConfig);
        // 验证解析后的结果是否为对象
        if (typeof parsedExtraConfig !== "object" || Array.isArray(parsedExtraConfig)) {
          return error("额外配置必须是有效的 JSON 对象");
        }
      } catch (e) {
        return error("额外配置必须是有效的 JSON 格式");
      }
    }

    // 创建配置
    const config = await prisma.translationConfig.create({
      data: {
        name: name.trim(),
        provider: provider.trim(),
        apiKey: apiKey?.trim() || null,
        apiSecret: apiSecret?.trim() || null,
        apiEndpoint: apiEndpoint?.trim() || null,
        timeout,
        maxRetries,
        priority,
        extraConfig: parsedExtraConfig ? JSON.stringify(parsedExtraConfig) : null,
        isActive,
      },
    });

    return success(config, "创建成功");
  } catch (err: any) {
    // 处理唯一约束错误
    if (err.code === "P2002") {
      return error("配置已存在（名称或服务商重复）");
    }
    return error(err.message || "创建翻译配置失败");
  }
});

