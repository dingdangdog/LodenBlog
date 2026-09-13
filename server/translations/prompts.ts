/**
 * 大模型翻译提示词生成工具
 * 专门针对Markdown格式文章优化，确保格式完整性
 */

/**
 * 语言名称映射
 */
const LANGUAGE_NAMES: Record<string, string> = {
  zh: "中文",
  en: "英文",
  ja: "日文",
  ko: "韩文",
  fr: "法文",
  de: "德文",
  es: "西班牙文",
  it: "意大利文",
  pt: "葡萄牙文",
  ru: "俄文",
  ar: "阿拉伯文",
};

/**
 * 获取语言名称
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code;
}

/**
 * 生成Markdown文章翻译提示词
 *
 * 该提示词专门针对Markdown格式优化，确保：
 * 1. 保留所有Markdown语法结构（标题、列表、代码块、链接等）
 * 2. 只翻译文本内容，不改变格式
 * 3. 保持代码块和行内代码不变
 * 4. 保持链接URL不变，只翻译链接文本
 * 5. 保持图片标记不变
 *
 * @param text 要翻译的文本（通常是Markdown格式）
 * @param from 源语言代码
 * @param to 目标语言代码
 * @returns 完整的翻译提示词
 */
export function generateMarkdownTranslationPrompt(
  text: string,
  from: string,
  to: string
): string {
  const sourceLangName = getLanguageName(from);
  const targetLangName = getLanguageName(to);

  return `你是一位专业的翻译专家，擅长翻译Markdown格式的文章。请将以下“${sourceLangName}”文本翻译成“${targetLangName}”。

## 翻译要求

1. **保留所有Markdown格式，部分格式举例说明**：
   - 标题标记（# ## ### 等）必须完全保留
   - 列表标记（- * + 或数字）必须完全保留
   - 代码块标记（\`\`\`语言名）必须完全保留
   - 行内代码标记（\`代码\`）必须完全保留
   - 链接格式（[文本](URL)）必须完全保留，只翻译文本部分
   - 图片标记（![alt](URL)）必须完全保留
   - 链接URL（如 https://example.com）**绝对不要翻译或修改**
   - 保留所有特殊字符（如 $, %, &, <, > 等）
   - 保留所有空格和换行
   - 保留所有HTML实体（如 &nbsp; &lt; 等）
   - 保留原文的换行结构。
   - 表格格式，必须完全保留
   - 其他未提到的特殊格式，根据实际情况判断是否需要翻译
   - 补充：不要擅自添加原本没有的标题、列表等特殊格式

2. **翻译质量**：
   - 翻译要自然流畅，符合目标语言的表达习惯
   - 技术术语保持准确，必要时保留英文原文
   - 保持原文的语气和风格

3. **输出要求**：
   - **只输出翻译后的Markdown文本**
   - **除翻译内容外，不要添加任何解释、说明或注释**
   - **不要添加"翻译结果："等前缀**
   - **直接输出翻译后的完整内容**

## 原文

${text}

`;
}

/**
 * 生成简化版翻译提示词（用于非Markdown文本，如标题、摘要等）
 *
 * @param text 要翻译的文本
 * @param from 源语言代码
 * @param to 目标语言代码
 * @returns 简化的翻译提示词
 */
export function generateSimpleTranslationPrompt(
  text: string,
  from: string,
  to: string
): string {
  const sourceLangName = getLanguageName(from);
  const targetLangName = getLanguageName(to);

  return `请将以下“${sourceLangName}”文本翻译成“${targetLangName}”，只返回翻译结果，不要包含任何解释或其他内容：

${text}`;
}

/**
 * 检测文本是否为Markdown格式
 *
 * @param text 要检测的文本
 * @returns 是否为Markdown格式
 */
export function isMarkdownFormat(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // 检测常见的Markdown特征
  const markdownPatterns = [
    /^#{1,6}\s+.+/m, // 标题
    /^\s*[-*+]\s+.+/m, // 无序列表
    /^\s*\d+\.\s+.+/m, // 有序列表
    /```[\s\S]*?```/, // 代码块
    /`[^`]+`/, // 行内代码
    /\[.+\]\(.+\)/, // 链接
    /!\[.+\]\(.+\)/, // 图片
    /^\s*>\s+.+/m, // 引用
    /^\s*\|.+\|/m, // 表格
    /^---+$/m, // 分隔线
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
}

/**
 * 智能生成翻译提示词
 * 根据文本格式自动选择使用Markdown提示词或简化提示词
 *
 * @param text 要翻译的文本
 * @param from 源语言代码
 * @param to 目标语言代码
 * @returns 翻译提示词
 */
export function generateTranslationPrompt(
  text: string,
  from: string,
  to: string
): string {
  // 对于较长的文本，优先使用Markdown提示词（因为文章内容通常是Markdown）
  // 对于较短的文本，检测是否为Markdown格式
  if (text.length > 100 || isMarkdownFormat(text)) {
    return generateMarkdownTranslationPrompt(text, from, to);
  } else {
    return generateSimpleTranslationPrompt(text, from, to);
  }
}
