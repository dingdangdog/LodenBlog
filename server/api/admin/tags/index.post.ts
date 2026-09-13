import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { slug, name, color, languageCode } = body;

    if (!slug || !name || !languageCode) {
      return error("Slug、名称和语言代码不能为空");
    }

    const existing = await prisma.tag.findUnique({
      where: {
        slug_languageCode: {
          slug,
          languageCode,
        },
      },
    });

    if (existing) {
      return error("该语言下已存在相同Slug的标签");
    }

    const tag = await prisma.tag.create({
      data: {
        slug,
        name,
        color: color || null,
        languageCode,
      },
    });

    return success({ tag }, "创建成功");
  } catch (err: any) {
    return error(err.message || "创建标签失败");
  }
});
