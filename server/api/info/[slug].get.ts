import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { isRetiredInfoSlug } from "~~/server/info-template";

/**
 * 根据 slug 与语言获取单条信息页（用户协议、隐私政策、关于等）
 */
export default defineEventHandler(async (event) => {
  try {
    const slugParam = getRouterParam(event, "slug");
    const query = getQuery(event);
    const languageCode = (query.languageCode as string) || "";

    if (!slugParam) {
      return error("信息 slug 不能为空");
    }

    const slug = slugParam.toLowerCase();

    if (isRetiredInfoSlug(slug)) {
      return error("信息页不存在", null);
    }

    const infoBase = await prisma.infoBase.findUnique({
      where: { slug },
    });

    if (!infoBase) {
      return error("信息页不存在", null);
    }

    let infoContent = null;
    if (languageCode) {
      infoContent = await prisma.infoContent.findFirst({
        where: {
          infoBaseId: infoBase.id,
          languageCode,
        },
      });
    }
    if (!infoContent) {
      infoContent = await prisma.infoContent.findFirst({
        where: { infoBaseId: infoBase.id },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!infoContent) {
      return error("该信息页暂无内容", null);
    }

    const allContents = await prisma.infoContent.findMany({
      where: { infoBaseId: infoBase.id },
      select: { languageCode: true, title: true },
      orderBy: { createdAt: "asc" },
    });

    return success({
      slug: infoBase.slug,
      title: infoContent.title,
      content: infoContent.content,
      languageCode: infoContent.languageCode,
      updatedAt: infoContent.updatedAt,
      availableTranslations: allContents,
    });
  } catch (err: any) {
    return error(err.message || "获取信息页失败");
  }
});
