export const useTheme = () => {
  const themeStore = useThemeStore();

  onMounted(() => {
    if (!themeStore.themeConfigLoaded) {
      void themeStore.initTheme();
    }
  });

  return {
    currentMode: themeStore.currentMode,
    isDark: themeStore.isDark,
    themeNames: themeStore.themeNames,
    themeConfigLoaded: themeStore.themeConfigLoaded,
    fetchThemeConfig: themeStore.fetchThemeConfig,
    setMode: themeStore.setMode,
    toggleMode: themeStore.toggleMode,
    cycleMode: themeStore.cycleMode,
  };
};
