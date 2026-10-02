import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import { DomainError, requireOwnColumn } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    const codeId = getRouterParam(event, "codeId");
    if (!id || !codeId) return error("参数不完整");
    await requireOwnColumn(user.id, id);
    const updated = await prisma.columnRedeemCode.updateMany({
      where: { id: codeId, columnId: id, status: "UNUSED" },
      data: { status: "REVOKED" },
    });
    if (updated.count !== 1) return error("只能作废未使用的兑换码");
    return success({ id: codeId }, "已作废");
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "作废兑换码失败");
  }
});
