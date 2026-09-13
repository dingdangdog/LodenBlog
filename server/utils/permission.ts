import { H3Event } from "h3";
import { getServerSession } from "#auth";

import { createError } from "h3";
import { ROLE_LEVEL, RoleLevel, hasRequiredRole } from "~~/utils/role";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: number;
}

function mapSessionUser(sessionUser: any): AuthUser | null {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    username:
      sessionUser.username || sessionUser.name || sessionUser.email || "",
    role: Number(sessionUser.role ?? ROLE_LEVEL.USER),
  };
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(event: H3Event): Promise<AuthUser | null> {
  const session = await getServerSession(event);
  return mapSessionUser(session?.user);
}

/**
 * 兼容函数，直接调用 getCurrentUser
 */
export async function getCurrentUserFromSession(
  event: H3Event
): Promise<AuthUser | null> {
  return getCurrentUser(event);
}

/**
 * 获取并要求用户已登录
 */
export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const user = await getCurrentUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "未登录",
    });
  }
  return user;
}

/**
 * 检查用户是否具有指定角色
 */
export function hasRole(user: AuthUser, minRole: RoleLevel): boolean {
  return hasRequiredRole(user.role, minRole);
}

/**
 * 要求用户具有指定角色之一（由中间件保证已登录）
 */
export async function requireRole(
  event: H3Event,
  minRole: RoleLevel
): Promise<AuthUser> {
  const user = await requireAuth(event);
  if (!hasRole(user, minRole)) {
    throw createError({
      statusCode: 403,
      message: "权限不足",
    });
  }
  return user;
}

/**
 * 要求用户是普通用户或以上
 */
export function requireUser(event: H3Event): Promise<AuthUser> {
  return requireRole(event, ROLE_LEVEL.USER);
}

/**
 * 要求用户是创作者或以上
 */
export function requireCreator(event: H3Event): Promise<AuthUser> {
  return requireRole(event, ROLE_LEVEL.CREATOR);
}

/**
 * 要求用户是管理员
 */
export function requireAdmin(event: H3Event): Promise<AuthUser> {
  return requireRole(event, ROLE_LEVEL.ADMIN);
}

/**
 * 检查用户是否是资源的所有者或管理员
 */
export async function requireOwnerOrAdmin(
  event: H3Event,
  resourceOwnerId: string
): Promise<AuthUser> {
  const user = await requireAuth(event);

  if (user.id !== resourceOwnerId && !hasRole(user, ROLE_LEVEL.ADMIN)) {
    throw createError({
      statusCode: 403,
      message: "权限不足，只能操作自己的资源",
    });
  }

  return user;
}

export { ROLE_LEVEL } from "~~/utils/role";
