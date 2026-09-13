export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore();
  void themeStore.initTheme();
});

