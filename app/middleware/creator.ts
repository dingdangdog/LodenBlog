/**
 * 创作者/管理员权限校验
 * 需已登录（建议与 auth 中间件配合使用）
 */
export default defineNuxtRouteMiddleware(() => {
  const { data: session, status } = useAuth();
  const localePath = useLocalePath();

  if (status.value === "loading") {
    return;
  }

  const userRole = Number(session.value?.user?.role ?? 0);
  if (userRole < 2) {
    return navigateTo(localePath("/"));
  }
});
