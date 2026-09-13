/**
 * 登录校验（命名中间件）
 * @usage middleware: ['auth']
 */
export default defineNuxtRouteMiddleware((to) => {
  const { status } = useAuth();
  const localePath = useLocalePath();

  if (status.value === "loading") {
    return;
  }

  if (status.value !== "authenticated") {
    // 携带来源页面参数，便于登录后回跳
    const currentPath = to.fullPath;
    return navigateTo({
      path: localePath("/login"),
      query: {
        callbackUrl: currentPath,
      },
    });
  }
});
