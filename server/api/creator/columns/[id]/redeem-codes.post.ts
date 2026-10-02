import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator } from "~~/server/utils/permission";
import {
  DomainError,
  createUniqueRedeemCodes,
  requireOwnColumn,
} from "~~/server/utils/column-domain";
import { isSubscriptionDuration } from "~~/utils/column-access";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const id = getRouterParam(event, "id");
    if (!id) return error("专栏 ID 不能为空");
    await requireOwnColumn(user.id, id);
    const body = await readBody(event);
    const durationDays = Number(body?.durationDays);
    const count = Number(body?.count);
    if (!isSubscriptionDuration(durationDays)) {
      return error("订阅时长只能是 30、90 或 365 天");
    }
    const codes = await createUniqueRedeemCodes(count);
    await prisma.columnRedeemCode.createMany({
      data: codes.map((code) => ({
        columnId: id,
        code,
        durationDays,
        createdBy: user.id,
      })),
    });
    return success({ codes }, "兑换码已生成");
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "生成兑换码失败");
  }
});
