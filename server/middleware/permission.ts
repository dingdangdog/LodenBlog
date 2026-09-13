import { ROLE_LEVEL } from "~~/utils/role";

/**
 * 后端权限中间件
 * 检查用户角色权限
 */
export default defineEventHandler(async (event) => {
  const path = event.path;

  // 不是 API 路径，跳过
  if (!path.startsWith("/api/")) {
    return;
  }

  // 定义路径权限要求
  const permissionMap: Record<string, number> = {
    "/api/admin": ROLE_LEVEL.ADMIN,
    "/api/creator": ROLE_LEVEL.CREATOR,
    "/api/entry": ROLE_LEVEL.USER,
  };

  // 检查路径是否需要特定权限
  for (const [prefix, requiredRole] of Object.entries(permissionMap)) {
    if (path.startsWith(prefix)) {
      const user = event.context.user;

      if (!user) {
        throw createError({
          statusCode: 401,
          message: "未登录",
        });
      }

      const currentRole = Number(user.role ?? 0);
      // console.log("currentRole", currentRole);
      // console.log("requiredRole", requiredRole);
      if (currentRole < requiredRole) {
        throw createError({
          statusCode: 403,
          message: "权限不足",
        });
      }

      break;
    }
  }
});
