/**
 * 普通创作者访问 /admin 时重定向到创作者看板 /admin/creator
 * 仅当路径为后台首页且用户为创作者（非管理员）时执行重定向
 */
export default defineNuxtRouteMiddleware((to) => {
  const { data: session, status } = useAuth();
  const localePath = useLocalePath();

  if (status.value === "loading") {
    return;
  }

  const path = to.path;
  const isAdminIndex = path === "/admin" || /^\/[a-z]{2}\/admin$/i.test(path);

  if (!isAdminIndex) {
    return;
  }

  const userRole = Number(session.value?.user?.role ?? 0);
  const ROLE_ADMIN = 99;
  const ROLE_CREATOR = 2;
  const isAdmin = userRole >= ROLE_ADMIN;
  const isCreator = userRole >= ROLE_CREATOR;

  if (isCreator && !isAdmin) {
    return navigateTo(localePath("/admin/creator"), { replace: true });
  }
});
