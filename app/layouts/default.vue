<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1 min-h-[100vh-4rem]">
      <slot></slot>
    </main>
    <AppFooter />
    <!-- 返回顶部按钮 -->
    <Transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
      <button v-if="showBackToTop" @click="scrollToTop"
        class="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 p-3 md:p-4 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        aria-label="返回顶部">
        <ArrowUpIcon class="w-5 h-5 md:w-6 md:h-6" />
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ArrowUpIcon } from "@heroicons/vue/24/outline";
import { GOOGLE_ADS_FETCH_KEY } from "~/composables/useArticleAds";

const route = useRoute();
const showBackToTop = ref(false);
const scrollThreshold = 400; // 滚动超过 400px 时显示按钮

const handleScroll = () => {
  if (!process.client) return;
  showBackToTop.value = window.scrollY > scrollThreshold;
};

const scrollToTop = () => {
  if (!process.client) return;
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

// Google Analytics 配置
const { data: googleAnalyticsData } = await await useFetch<{
  c: number;
  m: string;
  d: { id: string | null; enabled: boolean };
}>("/api/system/google-analytics");

// 提取 Google Analytics 配置
const gaId = computed(() => googleAnalyticsData.value?.d?.id || null);
const isEnabled = computed(
  () => googleAnalyticsData.value?.d?.enabled || false
);

// Google Ads 配置
const { data: googleAdsData } = await useFetch<{
  c: number;
  m: string;
  d: { id: string | null; enabled: boolean };
}>("/api/system/google-ads", { key: GOOGLE_ADS_FETCH_KEY });

// 从 API 返回的 id 中清洗出纯数字 ID（去掉 ca-pub- / pub- 前缀与首尾空格）
function normalizeAdsId(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const numeric = trimmed.replace(/^(?:ca-pub-|pub-)/i, "");
  return /^\d+$/.test(numeric) ? numeric : null;
}

const adsNumericId = computed(() =>
  normalizeAdsId(googleAdsData.value?.d?.id ?? null)
);
const adsClientId = computed(() =>
  adsNumericId.value ? `ca-pub-${adsNumericId.value}` : null
);
const adsAccountMeta = computed(() => adsClientId.value);
const isAdsEnabled = computed(
  () => !!googleAdsData.value?.d?.enabled && !!adsClientId.value
);

// 动态添加 Google Analytics 和 Google Ads 脚本及 meta 标签
useHead({
  script: computed(() => {
    const scripts: any[] = [];

    // Google Analytics 脚本
    if (isEnabled.value && gaId.value) {
      // 外部脚本
      scripts.push({
        src: `https://www.googletagmanager.com/gtag/js?id=${gaId.value}`,
        async: true,
      });

      // 内联初始化脚本（必须紧跟在外部脚本之后）
      scripts.push({
        innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId.value}');
        `,
        type: "text/javascript",
      });
    }

    // Google Ads 脚本
    if (isAdsEnabled.value && adsClientId.value) {
      scripts.push({
        key: "google-adsense",
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClientId.value}`,
        async: true,
        crossorigin: "anonymous",
      });
    }

    return scripts;
  }),
  meta: computed(() => {
    const metas: any[] = [];

    // Google Adsense meta 标签
    // 作用：
    // 1. 帮助 Google Adsense 识别和验证网站所有者
    // 2. 提供额外的网站所有权验证方式
    // 3. 用于某些 Adsense 功能的验证（如自动广告、广告单元验证等）
    // 4. 提高广告投放的准确性和安全性
    if (isAdsEnabled.value && adsAccountMeta.value) {
      metas.push({
        name: "google-adsense-account",
        content: adsAccountMeta.value,
      });
    }

    return metas;
  }),
});

// 跟踪页面浏览
const trackPageView = () => {
  if (!process.client) return;

  // Google Analytics 跟踪
  if (isEnabled.value && gaId.value) {
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag("config", gaId.value, {
        page_path: route.fullPath,
      });
    }
  }

  // 记录访客日志
  // 注意：文章页面的访问日志由 /api/articles/[slug]/view 端点记录
  // 这里只记录非文章页面的访问日志，避免重复记录
  const uri = route.fullPath || route.path || "/";
  const isArticlePage =
    /^\/.*\/post\/[^/]+$/.test(uri) || /^\/post\/[^/]+$/.test(uri);

  if (!isArticlePage) {
    $fetch("/api/visit/record", {
      method: "GET",
      query: { uri },
    }).catch((err) => {
      // 静默处理错误，不影响页面加载
      console.error("记录访客日志失败:", err);
    });
  }
};

// 监听路由变化，跟踪页面浏览
watch(
  () => route.fullPath,
  () => {
    if (process.client) {
      // 延迟一下确保页面已加载
      nextTick(() => {
        trackPageView();
      });
    }
  },
  { immediate: false }
);

onMounted(() => {
  if (process.client) {
    // 滚动事件监听
    window.addEventListener("scroll", handleScroll, { passive: true });
    // 初始化检查
    handleScroll();
    // 首次加载时跟踪页面浏览
    trackPageView();
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener("scroll", handleScroll);
  }
});
</script>
