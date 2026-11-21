import { success, error } from "~~/server/utils/result";
import { requireAdmin } from "~~/server/utils/permission";
import prisma from "~~/lib/prisma";

// 用户数量统计，供系统看板展示
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const userCount = await prisma.user.count();

    return success({ userCount }, "获取成功");
  } catch (err: any) {
    return error(err.message || "获取用户数量失败");
  }
});
