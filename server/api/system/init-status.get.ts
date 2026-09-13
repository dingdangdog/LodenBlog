import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";
import { ROLE_LEVEL } from "~~/utils/role";

/**
 * 检查系统是否已初始化
 */
export default defineEventHandler(async (event) => {
  try {
    // 检查是否存在管理员用户
    const adminCount = await prisma.user.count({
      where: {
        role: ROLE_LEVEL.ADMIN,
      },
    });

    // 检查是否存在系统设置
    const settingCount = await prisma.setting.count();

    const isInitialized = adminCount > 0 && settingCount > 0;

    return success({
      isInitialized,
      hasAdmin: adminCount > 0,
      hasSettings: settingCount > 0,
    });
  } catch (err: any) {
    return error(err.message || "检查初始化状态失败");
  }
});
