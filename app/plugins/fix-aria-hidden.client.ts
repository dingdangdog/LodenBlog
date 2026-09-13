/**
 * 禁止在 <body> 上设置 aria-hidden，避免违反 WAI-ARIA 规范并触发浏览器警告。
 * 常见触发源：带 aria-modal 的对话框、第三方脚本（如 AdSense/reCAPTCHA）。
 */
export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  const removeAriaHiddenFromBody = () => {
    if (document.body.hasAttribute("aria-hidden")) {
      document.body.removeAttribute("aria-hidden");
    }
  };

  removeAriaHiddenFromBody();

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "aria-hidden") {
        removeAriaHiddenFromBody();
        break;
      }
    }
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["aria-hidden"],
  });

  // 插件卸载时断开观察
  const stop = () => observer.disconnect();
  try {
    const nuxtApp = useNuxtApp();
    nuxtApp.hook("app:beforeUnmount", stop);
  } catch {
    // 忽略
  }
});
