import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { chat } from "~~/server/ai";
import type { TranslationProviderConfig } from "~~/server/translations/types";
import { dbRowToConfig } from "~~/server/utils/provider-config";

/**
 * AI 配置连通性测试
 * POST /api/admin/ai-configs/[id]/test
 */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("AI配置 ID 不能为空");
    }

    const row = await prisma.aiConfig.findUnique({
      where: { id },
    });

    if (!row) {
      return error("AI配置不存在");
    }

    if (!row.apiKey || !row.apiKey.trim()) {
      return error("该配置未设置 API Key，无法测试");
    }

    const config: TranslationProviderConfig = dbRowToConfig(row);
    const testPrompt = "请只回复：OK";
    const timeoutMs = Math.min(config.timeout || 30000, 15000);
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
