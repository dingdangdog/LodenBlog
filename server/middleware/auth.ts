import { getServerSession } from "#auth";
import { createError } from "h3";

/**
 * 后端认证中间件
 * 只拦截 /api/creator 和 /api/admin 开头的接口，其他接口一律不需要拦截验证
 */
export default defineEventHandler(async (event) => {
  const path = event.path;

  // 只对 /api/creator 和 /api/admin 开头的路径进行认证检查
  if (
    !path.startsWith("/api/entry") &&
    !path.startsWith("/api/creator") &&
    !path.startsWith("/api/admin")
  ) {
    return;
  }

  // 需要认证的路径
  const session = await getServerSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: "未登录",
    });
  }

  // 将用户信息附加到 event.context
  event.context.user = session.user;
});
