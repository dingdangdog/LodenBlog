/**
 * 管理员权限校验
 */
export default defineNuxtRouteMiddleware(() => {
  const { data: session, status } = useAuth();
  const localePath = useLocalePath();

  if (status.value === "loading") {
    return;
  }

  const userRole = Number(session.value?.user?.role ?? 0);
  if (userRole < 99) {
    return navigateTo(localePath("/"));
  }
});
