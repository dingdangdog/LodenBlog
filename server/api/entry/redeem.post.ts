import { success, error } from "~~/server/utils/result";
import { requireUser } from "~~/server/utils/permission";
import { DomainError, redeemByCode } from "~~/server/utils/column-domain";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireUser(event);
    const body = await readBody(event);
    const result = await redeemByCode(user.id, body?.code);
    return success(result, "兑换成功");
  } catch (err: unknown) {
    if (err instanceof DomainError) return error(err.message);
    return error(err instanceof Error ? err.message : "兑换失败");
  }
});
