import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { generateThemeConfigPrompt } from "~~/server/translations/theme-prompts";
import { callAIWithPrompt } from "~~/server/utils/ai-call";
import { getProviderConfigForAI } from "~~/server/ai";

/**
 * AI生成主题配置
 * 接收用户描述的颜色要求，使用AI生成主题配置并直接入库
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      colorDescription,
      mode,
      name,
      displayName,
      providerId,
      isDefault = false,
      sortOrder = 0,
    } = body;

    // 验证必填字段
    if (!colorDescription || !mode || !name || !displayName) {
      return error("参数错误", "缺少必填字段：colorDescription、mode、name、displayName");
    }

    // 验证模式
    if (!["light", "dark"].includes(mode)) {
      return error("参数错误", "主题模式必须是 light 或 dark");
    }

    // 检查主题名称是否已存在
    const existing = await prisma.theme.findUnique({
      where: { name },
    });

    if (existing) {
      return error("主题已存在", "该主题名称已被使用");
    }

    const providerConfig = await getProviderConfigForAI(providerId || null);
    if (!providerConfig) {
      return error(
        "AI服务商不可用",
        "没有可用的AI服务商，请先配置AI服务或指定 providerId"
      );
    }

    // 生成提示词
    const prompt = generateThemeConfigPrompt(colorDescription, mode);

    // 调用AI生成主题配置
    let generatedJson: string;
    try {
      generatedJson = await callAIWithPrompt(prompt, providerConfig);
    } catch (aiError: any) {
      console.error("AI生成主题配置失败:", aiError);
      return error(
        "AI生成失败",
        `AI生成主题配置时出错: ${aiError.message || "未知错误"}`
      );
    }

    // 清理生成的JSON（移除可能的markdown代码块标记）
    let cleanedJson = generatedJson.trim();
    
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

    // 如果设置为默认主题，取消其他同模式主题的默认状态
    if (isDefault) {
      await prisma.theme.updateMany({
        where: {
          mode,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // 创建主题
    const theme = await prisma.theme.create({
      data: {
        name,
        displayName,
        mode,
        colors: JSON.stringify(colors),
        isDefault,
        sortOrder,
        isActive: true,
      },
    });

    return success(
      {
        theme,
        generatedColors: colors,
      },
      "主题生成并创建成功"
    );
  } catch (err: any) {
    console.error("生成主题失败:", err);
    return error("生成主题失败", err.message || "未知错误");
  }
});

