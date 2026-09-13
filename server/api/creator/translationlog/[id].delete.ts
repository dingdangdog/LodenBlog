import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { requireCreator, ROLE_LEVEL } from "~~/server/utils/permission";

/**
 * 删除翻译日志
 * DELETE /api/creator/translationlog/[id]
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireCreator(event);
    const logId = getRouterParam(event, "id");

    if (!logId) {
      return error("日志 ID 不能为空");
    }

    // 查询日志
    const log = await prisma.translationLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      return error("日志不存在");
    }

    // 权限检查：非管理员只能删除自己的日志
    if (user.role < ROLE_LEVEL.ADMIN && log.userId !== user.id) {
      return error("无权限删除此日志");
    }

    // 删除日志
    await prisma.translationLog.delete({
      where: { id: logId },
    });

    return success(null, "删除成功");
  } catch (err: any) {
    return error(err.message || "删除日志失败");
  }
});
