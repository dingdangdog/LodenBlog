import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  try {
    // 需要创作者权限
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");

    if (!id) {
      return error("文章 ID 不能为空");
    }

    const body = await readBody(event);
    const { targetLanguageId, autoTranslate = false } = body;

    if (!targetLanguageId) {
      return error("目标语言 ID 不能为空");
    }

    // 获取原文
    const original = await prisma.article.findUnique({
      where: { id },
    });

    if (!original) {
      return error("文章不存在");
    }

    // 检查目标语言是否已存在翻译
    const existingTranslation = await prisma.article.findFirst({
      where: {
        originalId: id,
        languageId: targetLanguageId,
      },
    });

    if (existingTranslation) {
      return error("该语言版本已存在");
    }

    // 获取目标语言代码，用于生成 slug
    const targetLang = await prisma.language.findUnique({
      where: { id: targetLanguageId },
    });

    if (!targetLang) {
      return error("目标语言不存在");
    }

    // 创建翻译文章（先复制原文，后续接入真实翻译服务）
    const translatedArticle = await prisma.article.create({
      data: {
        slug: `${original.slug}-${targetLang.code}`,
        title: autoTranslate ? `[翻译中] ${original.title}` : original.title,
        content: autoTranslate
          ? `[翻译中] ${original.content}`
          : original.content,
        excerpt: original.excerpt,
        featuredImage: original.featuredImage,
        languageId: targetLanguageId,
        categoryId: original.categoryId,
        originalId: original.originalId || original.id,
        authorId: user.id,
        status: "DRAFT",
        isPublished: false,
        seoTitle: original.seoTitle,
        seoDescription: original.seoDescription,
        seoKeyword: original.seoKeyword,
      },
    });

    // TODO: 如果 autoTranslate 为 true，接入真实翻译服务

    return success({ article: translatedArticle }, "翻译文章创建成功");
  } catch (err: any) {
    return error(err.message || "翻译文章失败");
  }
});
