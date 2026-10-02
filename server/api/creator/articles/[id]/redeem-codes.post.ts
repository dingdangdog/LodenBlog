import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import {
  DomainError,
  createUniqueRedeemCodes,
  requireOwnArticle,
} from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("文章 ID 不能为空");
    const article = await requireOwnArticle(user.id, id);
    if (article.accessType !== "PAID") {
      return error("只有单篇付费文章可以生成解锁码");
    }
    const count = Number((await readBody(event))?.count);
    const codes = await createUniqueRedeemCodes(count);
    await prisma.articleRedeemCode.createMany({
      data: codes.map((code) => ({
        articleBaseId: id,
        code,
        createdBy: user.id,
      })),
    });
    return success({ codes }, "兑换码已生成");
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "生成兑换码失败");
  }
});
