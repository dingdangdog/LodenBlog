import { success, error } from "~~/server/utils/result";
import { requireAdmin } from "~~/server/utils/permission";
import prisma from "~~/lib/prisma";

// 创作者申请统计 - 返回待审批数量，供系统看板展示
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const pendingCount = await prisma.creatorApplication.count({
      where: { status: "PENDING" },
    });

    return success({ pendingCount }, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取统计失败");
  }
});
