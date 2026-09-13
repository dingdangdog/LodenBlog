import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("标签 ID 不能为空");
    }

    const body = await readBody(event);
    const { slug, name, color, languageCode } = body;

    const existing = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existing) {
      return error("标签不存在");
    }

    if (slug && slug !== existing.slug) {
      // 检查新 slug 在当前语言下是否已存在
      const duplicate = await prisma.tag.findUnique({
        where: {
          slug_languageCode: {
            slug,
            languageCode: languageCode || existing.languageCode,
          },
        },
      });

      if (duplicate) {
        return error("该语言下已存在相同Slug的标签");
      }

      // 检查新 slug 在其他语言下是否已存在（排除当前标签）
      const duplicateInOtherLang = await prisma.tag.findFirst({
        where: {
          slug,
          id: {
            not: id,
          },
        },
      });

      if (duplicateInOtherLang) {
        return error(
          `新 slug "${slug}" 在其他语言（${duplicateInOtherLang.languageCode}）下已存在`
        );
      }
    }

    const updateData: any = {};
    if (slug !== undefined) updateData.slug = slug;
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (languageCode !== undefined) updateData.languageCode = languageCode;

    // 如果修改了slug，需要同步更新所有使用该标签的文章
    const oldSlug = existing.slug;
    const newSlug = slug !== undefined ? slug : oldSlug;
    const slugChanged = slug !== undefined && slug !== oldSlug;

    // 需要同步到所有相同 slug 标签的字段（不包括 name，它应该保持各语言独立）
    const syncData: any = {};
    if (color !== undefined) syncData.color = color;
    if (slugChanged) syncData.slug = newSlug;

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新当前标签
      const tag = await tx.tag.update({
        where: { id },
        data: updateData,
      });

      // 如果slug改变了，同步更新所有使用该标签的文章
      if (slugChanged) {
        // 查找所有包含该标签的文章
        const articles = await tx.articleBase.findMany({
          where: {
            tags: {
              not: null,
            },
          },
          select: {
            id: true,
            tags: true,
          },
        });

        // 更新每篇文章的tags字段
        for (const article of articles) {
          if (!article.tags) continue;

          try {
            const tagSlugs: string[] = JSON.parse(article.tags);
            const tagIndex = tagSlugs.indexOf(oldSlug);

            if (tagIndex !== -1) {
              // 替换旧的slug为新的slug
              tagSlugs[tagIndex] = newSlug;

              await tx.articleBase.update({
                where: { id: article.id },
                data: {
                  tags: JSON.stringify(tagSlugs),
                },
              });
            }
          } catch (e) {
            // 如果JSON解析失败，跳过该文章
            console.error(`解析文章 ${article.id} 的tags失败:`, e);
          }
        }
      }

      // 同步更新所有相同 slug 的其他语言标签（排除当前标签）
      if (Object.keys(syncData).length > 0) {
        await tx.tag.updateMany({
          where: {
            slug: oldSlug,
            id: {
              not: id,
            },
          },
          data: syncData,
        });
      }

      return tag;
    });

    return success({ tag: result }, "更新成功");
  } catch (err: any) {
    return error(err.message || "更新标签失败");
  }
});
