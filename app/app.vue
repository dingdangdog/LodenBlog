<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ConfirmDialog ref="confirmDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { initR2Domain } from "~/utils/avatar";
import ConfirmDialog from "~/components/common/ConfirmDialog.vue";
import { setConfirmDialogRef } from "~/composables/useConfirm";

initR2Domain();
const { locale } = useI18n();
const themeStore = useThemeStore();
const appStore = useAppStore();

// 确认对话框 ref
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null);

// 设置全局确认对话框引用
onMounted(() => {
  if (confirmDialogRef.value) {
    setConfirmDialogRef(confirmDialogRef.value);
  }
});

watch(
  () => themeStore.isDark,
  () => {
    if (process.client) {
      updateFavicon();
    }
  }
);

const settings = await useSettings(locale.value);
watchEffect(() => {
  if (settings.value) {
    appStore.setSettings(settings.value);
  }
});

const themeModeCookie = useCookie<"light" | "dark" | "system">("themeMode", {
  default: () => "light",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

const themeNamesCookie = useCookie<string>("themeNames", {
  default: () => "",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

interface ThemeDefaults {
  light: string;
  dark: string;
}

const parsedThemeNames = computed(() => {
  if (!themeNamesCookie.value) return null;
  try {
    return JSON.parse(themeNamesCookie.value) as ThemeDefaults;
  } catch {
    return null;
  }
});

// 解析后的暗色状态（system 在客户端按系统偏好解析）
const resolvedDark = computed(() => {
  if (process.client) {
    return themeStore.isDark;
  }
  return themeModeCookie.value === "dark";
});

// 计算 SSR 时的主题名称
const ssrThemeName = computed(() => {
  const mode: "light" | "dark" = resolvedDark.value ? "dark" : "light";
  const names = parsedThemeNames.value;
  if (names && names[mode]) {
    return names[mode];
  }
  return mode === "dark" ? "dark-blue" : "light-blue";
});

// 设置全局SEO信息和 favicon
useHead({
  htmlAttrs: {
    class: computed(() => (resolvedDark.value ? "dark" : "")),
    "data-theme": ssrThemeName,
  },
  title: computed(() => settings.value?.title || "i18n Blog"),
  meta: [
    {
      name: "description",
      content: computed(() => settings.value?.description || ""),
    },
    {
      name: "keywords",
      content: computed(() => settings.value?.keyword || ""),
    },
  ],
  link: computed(() => {
    const links: any[] = [];

    // Favicon - SSR 时使用默认，客户端会根据主题更新
    // SSR时无法判断主题，使用默认icon或light icon
    const faviconUrl = settings.value?.iconLight
      ? settings.value.iconLight
      : settings.value?.icon
        ? settings.value.icon
        : "/favicon.ico"; // SSR 默认使用 favicon.ico

    links.push({
      rel: "icon",
      href: faviconUrl,
    });

    return links;
  }),
  script: [
    {
      children: `
        (function() {
          try {
            var cookies = document.cookie.split('; ');
            var themeMode = 'light';
            try {
              var fromStorage = localStorage.getItem('themeMode');
              if (fromStorage === 'dark' || fromStorage === 'light' || fromStorage === 'system') {
                themeMode = fromStorage;
              }
            } catch (e) {}
            if (themeMode === 'light') {
              var themeModeCookie = cookies.find(function(row) { return row.startsWith('themeMode='); });
              var fromCookie = themeModeCookie ? themeModeCookie.split('=')[1] : null;
              if (fromCookie === 'dark' || fromCookie === 'light' || fromCookie === 'system') {
                themeMode = fromCookie;
              }
            }
            
            var themeNamesCookie = cookies.find(function(row) { return row.startsWith('themeNames='); });
            var themeNamesStr = themeNamesCookie ? themeNamesCookie.split('=')[1] : null;
            
            var themeNames = null;
            if (themeNamesStr) {
              try {
                themeNames = JSON.parse(decodeURIComponent(themeNamesStr));
              } catch (e) {
              }
            }
            
            var html = document.documentElement;
            var shouldBeDark = themeMode === 'system'
              ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
              : themeMode === 'dark';
            if (shouldBeDark) {
              html.classList.add('dark');
            } else {
              html.classList.remove('dark');
            }
            
            var resolvedMode = shouldBeDark ? 'dark' : 'light';
            if (themeNames && themeNames.light && themeNames.dark) {
              var themeName = themeNames[resolvedMode] || (resolvedMode === 'dark' ? 'dark-blue' : 'light-blue');
              if (themeName) {
                html.setAttribute('data-theme', themeName);
              }
            } else {
              var defaultThemeName = resolvedMode === 'dark' ? 'dark-blue' : 'light-blue';
              html.setAttribute('data-theme', defaultThemeName);
            }
          } catch (e) {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light-blue');
          }
        })();
      `,
      type: "text/javascript",
    },
  ],
});

// 更新 favicon 的函数
const updateFavicon = () => {
  if (!process.client) return;

  // 优先使用主题对应的icon
  let faviconUrl: string;
  if (themeStore.isDark) {
    faviconUrl = settings.value?.iconDark
      ? settings.value.iconDark
      : settings.value?.icon
        ? settings.value.icon
        : "/favicon.dark.ico";
  } else {
    faviconUrl = settings.value?.iconLight
      ? settings.value.iconLight
      : settings.value?.icon
        ? settings.value.icon
        : "/favicon.light.ico";
  }

  // 更新 favicon link
  let faviconLink = document.querySelector(
    "link[rel='icon']"
  ) as HTMLLinkElement;
  if (!faviconLink) {
    faviconLink = document.createElement("link");
    faviconLink.rel = "icon";
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = faviconUrl;
};

// 注入自定义内容（在客户端处理）
onMounted(async () => {
  themeStore.initTheme();

  // 初始化 favicon
  updateFavicon();

  // 初始化字典数据（一次性加载所有语言的分类和标签）
  const dictionaryStore = useDictionaryStore();
  await dictionaryStore.loadDictionaries();

  if (!settings.value) return;

  // 注入自定义Head HTML
  if (settings.value.customHead) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = settings.value.customHead;
    while (tempDiv.firstChild) {
      document.head.appendChild(tempDiv.firstChild);
    }
  }

  // 注入自定义CSS
  if (settings.value.customCSS) {
    const style = document.createElement("style");
    style.textContent = settings.value.customCSS;
    document.head.appendChild(style);
  }

  // 注入自定义JS
  if (settings.value.customJS) {
    const script = document.createElement("script");
    script.textContent = settings.value.customJS;
    document.head.appendChild(script);
  }
  // 记录访问次数（静默失败，不影响用户体验）
  // $fetch("/api/visit/record").catch(() => {
  // 静默处理错误，不影响用户体验
  // });
});
</script>
