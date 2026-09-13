/**
 * 系统初始化检查中间件
 * 在每次路由导航时检查系统是否已初始化
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const localePath = useLocalePath();
  // 如果已经在初始化页面，不再检查
  if (to.path === "/setup" || to.path === localePath("/setup")) {
    return;
  }

  // 检查是否已经检查过（使用 sessionStorage 缓存）
  if (process.client) {
    const checked = sessionStorage.getItem("init-checked");
    if (checked === "true") {
      return; // 已经检查过，跳过
    }
  }

  try {
    const response = await $fetch("/api/system/init-status");
    const data = response as any;

    if (data.c === 200 && data.d) {
      if (!data.d.isInitialized) {
        // 系统未初始化，跳转到初始化页面
        console.log("系统未初始化，跳转到初始化页面");
        return navigateTo(localePath("/setup"));
      } else {
        // 已初始化，标记为已检查
        if (process.client) {
          sessionStorage.setItem("init-checked", "true");
        }
      }
    }
  } catch (err) {
    console.error("检查系统初始化状态失败:", err);
    // 检查失败时不阻止导航
  }
});
