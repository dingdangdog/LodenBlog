import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { DomainError, publishFlags } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const body = await readBody(event);
    const languageCode = String(body?.languageCode || "").trim();
    const slug = String(body?.slug || "").trim().toLowerCase();
    const title = String(body?.title || "").trim();
    if (!languageCode || !slug || !title) {
      return error("语言、slug 和标题不能为空");
    }

    const language = await prisma.language.findUnique({
      where: { code: languageCode },
      select: { code: true },
    });
    if (!language) return error("语言不存在");

    const duplicate = await prisma.columnContent.findFirst({
      where: { slug, languageCode },
      select: { id: true },
    });
    if (duplicate) return error("该语言下已存在相同 slug 的专栏");

    const flags = publishFlags({
      status: body?.status,
      isPublished: body?.isPublished,
    });
    const featuredImage =
      typeof body?.featuredImage === "string" && body.featuredImage.trim()
        ? body.featuredImage.trim()
        : null;

    const column = await prisma.$transaction(async (tx) => {
      const created = await tx.column.create({
        data: {
          authorId: user.id,
          featuredImage,
          status: flags.status,
          isPublished: flags.isPublished,
        },
      });
      const content = await tx.columnContent.create({
        data: {
          columnId: created.id,
          languageCode,
          slug,
          title,
          description: body?.description ? String(body.description) : null,
          seoTitle: body?.seoTitle ? String(body.seoTitle) : null,
          seoDescription: body?.seoDescription ? String(body.seoDescription) : null,
          seoKeyword: body?.seoKeyword ? String(body.seoKeyword) : null,
        },
      });
      return { created, content };
    });

    return success(
      {
        column: {
          id: column.created.id,
          status: column.created.status,
          isPublished: column.created.isPublished,
          featuredImage: column.created.featuredImage,
          ...column.content,
        },
      },
      "创建成功"
    );
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "创建专栏失败");
  }
});
