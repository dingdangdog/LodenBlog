import { success, error } from "~~/server/utils/result";
import {
  getCurrentUserFromSession,
  ROLE_LEVEL,
} from "~~/server/utils/permission";

/**
 * 获取当前用户的可见性权限
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await getCurrentUserFromSession(event);

    if (!user) {
      return success({
        isAuthenticated: false,
        canAccessAdmin: false,
        canAccessCreator: false,
        role: null,
      });
    }

    const roleLevel = Number(user.role ?? 0);
    return success({
      isAuthenticated: true,
      canAccessAdmin: roleLevel >= ROLE_LEVEL.ADMIN,
      canAccessCreator: roleLevel >= ROLE_LEVEL.CREATOR,
      role: roleLevel,
    });
  } catch (err: any) {
    return error(err.message || "获取可见性权限失败");
  }
});
