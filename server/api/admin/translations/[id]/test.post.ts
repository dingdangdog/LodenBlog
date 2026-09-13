import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { chat } from "~~/server/ai";
import type { TranslationProviderConfig } from "~~/server/translations/types";

/**
 * 翻译配置连通性测试
 * POST /api/admin/translations/[id]/test
 * 使用当前配置向 AI 服务发送一条简单请求，验证 API Key 与端点是否可用
 */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("翻译配置 ID 不能为空");
    }

    const row = await prisma.translationConfig.findUnique({
      where: { id },
    });

    if (!row) {
      return error("翻译配置不存在");
    }

    if (!row.apiKey || !row.apiKey.trim()) {
      return error("该配置未设置 API Key，无法测试");
    }

    // 仅以下接口协议使用自有 API，无法用统一 chat 测试；其余（含 OpenAI 兼容、Nvidia 等）均可测试
    const noChatTestProviders = [
      "deepl",
      "volcano",
      "google",
      "baidu",
      "tencent",
      "youdao",
    ];
    const provider = (row.provider || "").toLowerCase();
    if (noChatTestProviders.includes(provider)) {
      return error(
        "当前接口协议暂不支持连通性测试",
        `支持测试的协议：OpenAI 兼容、Gemini、DeepSeek 等。当前为：${row.provider || "未知"}`
      );
    }

    const config: TranslationProviderConfig = {
      id: row.id,
      name: row.name,
      provider: row.provider,
      apiKey: row.apiKey,
      apiSecret: row.apiSecret,
      apiEndpoint: row.apiEndpoint,
      timeout: row.timeout ?? 30000,
      maxRetries: row.maxRetries ?? 3,
      priority: row.priority ?? 0,
      extraConfig: row.extraConfig,
      isActive: row.isActive,
    };

    const testPrompt = "请只回复：OK";
    const timeoutMs = Math.min(config.timeout || 30000, 15000); // 测试最多 15 秒
    const configWithShortTimeout = { ...config, timeout: timeoutMs };

    const reply = await chat(testPrompt, configWithShortTimeout);

    if (reply && reply.trim().toUpperCase().includes("OK")) {
      return success({ ok: true, message: "连通性正常" }, "连通性测试通过");
    }

    return success(
      { ok: true, message: "服务已响应", reply: reply?.trim().slice(0, 200) },
      "服务已响应"
    );
  } catch (err: any) {
    const msg = err?.message || err?.toString() || "未知错误";
    return error("连通性测试失败", msg);
  }
});
