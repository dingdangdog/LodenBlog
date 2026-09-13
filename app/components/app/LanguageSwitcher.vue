<template>
  <div v-if="hasMultiple" class="relative" ref="languageMenuRef">
    <button type="button" @click.stop="showLanguageMenu = !showLanguageMenu"
      class="flex items-center gap-1 md:gap-2 p-1 md:p-2 rounded-md text-sm font-medium text-foreground hover:bg-surface-muted transition-colors">
      <GlobeAltIcon class="w-5 h-5" />
      <span class="hidden sm:inline">{{ currentLocaleName }}</span>
      <ChevronDownIcon class="w-4 h-4" />
    </button>
    <!-- 下拉菜单 -->
    <div v-if="showLanguageMenu"
      class="absolute right-0 mt-2 w-32 bg-surface text-foreground rounded-md shadow-lg py-1 z-50 border border-border">
      <button v-for="loc in localeList" :key="loc.code" @click="switchLocale(loc.code)"
        class="w-full text-left px-4 py-2 text-sm transition-colors" :class="currentLocale === loc.code
          ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/20 font-medium'
          : 'text-foreground hover:bg-surface-muted'
          ">
        {{ loc.nativeName || loc.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  GlobeAltIcon,
  ChevronDownIcon,
} from "@heroicons/vue/24/outline";

const switchLocalePath = useSwitchLocalePath();
const router = useRouter();
const { locale } = useI18n();
const enabledLocales = useEnabledLocales();

const showLanguageMenu = ref(false);
const languageMenuRef = ref<HTMLElement | null>(null);

const currentLocale = computed(() => locale.value);
const hasMultiple = computed(() => enabledLocales.hasMultiple.value);
const localeList = computed(() => enabledLocales.list.value);
const currentLocaleName = computed(() => {
  const current = localeList.value.find(
    (l) => l.code === currentLocale.value
  );
  return current?.nativeName || current?.name || currentLocale.value.toUpperCase();
});

const switchLocale = (localeCode: string) => {
  showLanguageMenu.value = false;
  const path = switchLocalePath(localeCode as "zh" | "en" | "ja" | "de" | "es");
  router.push(path);
};

// 与 admin.vue 一致：点击外部关闭菜单。按钮用 @click.stop 避免本组件“打开”的点击冒泡到 document，否则 Header 的 document 监听会导致误关。
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (
      showLanguageMenu.value &&
      languageMenuRef.value &&
      !languageMenuRef.value.contains(target)
    ) {
      showLanguageMenu.value = false;
    }
  };
  document.addEventListener("click", handleClickOutside);

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });
});
</script>
