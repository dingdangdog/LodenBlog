import { success, error } from "~~/server/utils/result";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    // 验证管理员权限
    const id = getRouterParam(event, "id");
    if (!id) {
      return error("参数错误", "缺少主题 ID");
    }

    // 检查主题是否存在
    const theme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      return error("主题不存在");
    }

    // 如果是默认主题，不允许删除
    if (theme.isDefault) {
      return error("操作失败", "不能删除默认主题");
    }

    // 删除主题
    await prisma.theme.delete({
      where: { id },
    });

    return success(null, "主题删除成功");
  } catch (err: any) {
    console.error("删除主题失败:", err);
    return error("删除主题失败", err.message);
  }
});
