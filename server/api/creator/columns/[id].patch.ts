import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { DomainError, publishFlags, requireOwnColumn } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("专栏 ID 不能为空");
    await requireOwnColumn(user.id, id);
    const body = await readBody(event);
    const languageCode = String(body?.languageCode || "").trim();

    const data: {
      featuredImage?: string | null;
      status?: string;
      isPublished?: boolean;
    } = {};
    if (body?.featuredImage !== undefined) {
      data.featuredImage =
        typeof body.featuredImage === "string" && body.featuredImage.trim()
          ? body.featuredImage.trim()
          : null;
    }
    if (body?.status !== undefined || body?.isPublished !== undefined) {
      const flags = publishFlags({
        status: body?.status,
        isPublished: body?.isPublished,
      });
      data.status = flags.status;
      data.isPublished = flags.isPublished;
    }

    let content = null;
    if (languageCode) {
      const language = await prisma.language.findUnique({
        where: { code: languageCode },
        select: { code: true },
      });
      if (!language) return error("语言不存在");
      const slug = body?.slug != null ? String(body.slug).trim().toLowerCase() : undefined;
      const title = body?.title != null ? String(body.title).trim() : undefined;
      const existing = await prisma.columnContent.findFirst({
        where: { columnId: id, languageCode },
      });
      if (slug) {
        const duplicate = await prisma.columnContent.findFirst({
          where: {
            slug,
            languageCode,
            NOT: { columnId: id },
          },
          select: { id: true },
        });
        if (duplicate) return error("该语言下已存在相同 slug 的专栏");
      }
      if (!existing) {
        if (!slug || !title) return error("新语言版本需要 slug 和标题");
        content = await prisma.columnContent.create({
          data: {
            columnId: id,
            languageCode,
            slug,
            title,
            description: body?.description ? String(body.description) : null,
            seoTitle: body?.seoTitle ? String(body.seoTitle) : null,
            seoDescription: body?.seoDescription ? String(body.seoDescription) : null,
            seoKeyword: body?.seoKeyword ? String(body.seoKeyword) : null,
          },
        });
      } else {
        content = await prisma.columnContent.update({
          where: { id: existing.id },
          data: {
            ...(slug ? { slug } : {}),
            ...(title ? { title } : {}),
            ...(body?.description !== undefined
              ? { description: body.description ? String(body.description) : null }
              : {}),
            ...(body?.seoTitle !== undefined
              ? { seoTitle: body.seoTitle ? String(body.seoTitle) : null }
              : {}),
            ...(body?.seoDescription !== undefined
              ? { seoDescription: body.seoDescription ? String(body.seoDescription) : null }
              : {}),
            ...(body?.seoKeyword !== undefined
              ? { seoKeyword: body.seoKeyword ? String(body.seoKeyword) : null }
              : {}),
          },
        });
      }
    }

    const column = await prisma.column.update({
      where: { id },
      data,
    });
    return success({ column, content }, "保存成功");
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "保存专栏失败");
  }
});
