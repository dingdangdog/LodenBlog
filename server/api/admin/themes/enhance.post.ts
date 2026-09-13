import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { generateThemeEnhancementPrompt } from "~~/server/translations/theme-prompts";
import { callAIWithPrompt } from "~~/server/utils/ai-call";
import { getProviderConfigForAI } from "~~/server/ai";

/**
 * AI优化主题配置
 * 接收主题ID和优化描述，使用AI优化现有主题配置并更新
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      themeId,
      enhancementDescription,
      providerId,
    } = body;

    // 验证必填字段
    if (!themeId || !enhancementDescription) {
      return error("参数错误", "缺少必填字段：themeId、enhancementDescription");
    }

    // 获取当前主题
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      return error("主题不存在", "指定的主题ID不存在");
    }

    const providerConfig = await getProviderConfigForAI(providerId || null);
    if (!providerConfig) {
      return error(
        "AI服务商不可用",
        "没有可用的AI服务商，请先配置AI服务或指定 providerId"
      );
    }

    // 生成优化提示词
    const prompt = generateThemeEnhancementPrompt(
      theme.colors,
      enhancementDescription,
      theme.mode as "light" | "dark"
    );

    // 调用AI优化主题配置
    let enhancedJson: string;
    try {
      enhancedJson = await callAIWithPrompt(prompt, providerConfig);
    } catch (aiError: any) {
      console.error("AI优化主题配置失败:", aiError);
      return error(
        "AI优化失败",
        `AI优化主题配置时出错: ${aiError.message || "未知错误"}`
      );
    }

    // 清理生成的JSON（移除可能的markdown代码块标记）
    let cleanedJson = enhancedJson.trim();
    
    // 移除markdown代码块标记（如果存在）
    if (cleanedJson.startsWith("```json")) {
      cleanedJson = cleanedJson.replace(/^```json\s*/i, "");
    }
    if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```\s*/i, "");
    }
    if (cleanedJson.endsWith("```")) {
      cleanedJson = cleanedJson.replace(/\s*```$/i, "");
    }
    cleanedJson = cleanedJson.trim();

    // 解析JSON
    let colors: any;
    try {
      colors = JSON.parse(cleanedJson);
    } catch (parseError: any) {
      console.error("解析AI生成的JSON失败:", parseError);
      console.error("原始内容:", cleanedJson);
      return error(
        "解析失败",
        `AI生成的配置格式不正确，无法解析为JSON: ${parseError.message}`
      );
    }

    // 验证颜色配置结构
    if (!colors || typeof colors !== "object") {
      return error("配置格式错误", "AI生成的配置不是有效的对象");
    }

    // 更新主题
    const updatedTheme = await prisma.theme.update({
      where: { id: themeId },
      data: {
        colors: JSON.stringify(colors),
      },
    });

    return success(
      {
        theme: updatedTheme,
        enhancedColors: colors,
      },
      "主题优化成功"
    );
  } catch (err: any) {
    console.error("优化主题失败:", err);
    return error("优化主题失败", err.message || "未知错误");
  }
});

