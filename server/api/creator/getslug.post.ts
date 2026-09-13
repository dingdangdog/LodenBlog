import { success, error } from "~~/server/utils/result";
import { translateToSlug } from "~~/server/utils/translater";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { text, from, to, providerId } = body;

    if (!text || !text.trim()) {
      return error("text 不能为空");
    }

    if (!from) {
      return error("from（源语言）不能为空");
    }

    // 目标语言默认为英文
    const targetLanguage = to || "en";

    // 翻译并生成 slug
    const slug = await translateToSlug(
      text.trim(),
      from,
      targetLanguage,
      providerId
    );

    if (!slug) {
      return error("翻译失败，无法生成 slug");
    }

    return success({ slug }, "翻译成功");
  } catch (err: any) {
    return error(err.message || "翻译失败");
  }
});
