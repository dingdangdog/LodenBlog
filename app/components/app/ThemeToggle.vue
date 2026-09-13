<template>
  <button
    @click="cycleTheme"
    class="p-2 rounded-md text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
    :aria-label="ariaLabel"
  >
    <SunIcon v-if="currentMode === 'dark'" class="w-5 h-5" />
    <MoonIcon v-else-if="currentMode === 'light'" class="w-5 h-5" />
    <ComputerDesktopIcon v-else class="w-5 h-5" />
  </button>
</template>

<script setup lang="ts">
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/vue/24/outline";

const { t } = useI18n();
const themeStore = useThemeStore();
const currentMode = computed(() => themeStore.currentMode);

const ariaLabel = computed(() =>
  currentMode.value === "light"
    ? t("theme.switchToDark")
    : currentMode.value === "dark"
      ? t("theme.switchToSystem")
      : t("theme.switchToLight")
);

const cycleTheme = () => {
  themeStore.cycleMode();
};
</script>
