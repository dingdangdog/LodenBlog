<template>

  <Head>
    <Title>{{
      currentLanguageArticle?.seoTitle ||
      currentLanguageArticle?.title ||
      $t("article.title")
    }}</Title>
    <Meta name="description" :content="currentLanguageArticle?.seoDescription ||
      currentLanguageArticle?.excerpt ||
      ''
      " />
    <Meta name="keywords" :content="seoKeywords" />
    <Meta property="og:type" content="article" />
    <Meta property="og:title" :content="currentLanguageArticle?.seoTitle || currentLanguageArticle?.title || ''
      " />
    <Meta property="og:description" :content="currentLanguageArticle?.seoDescription ||
      currentLanguageArticle?.excerpt ||
      ''
      " />
    <Meta property="og:image" :content="ogImage" />
    <Meta property="og:url" :content="articleUrl" />
    <Meta property="og:site_name" :content="siteTitle" />
    <Meta name="twitter:card" content="summary_large_image" />
    <Meta name="twitter:title" :content="currentLanguageArticle?.seoTitle || currentLanguageArticle?.title || ''
      " />
    <Meta name="twitter:description" :content="currentLanguageArticle?.seoDescription ||
      currentLanguageArticle?.excerpt ||
      ''
      " />
    <Meta name="twitter:image" :content="ogImage" />
  </Head>
  <div class="container mx-auto px-2 md:px-4 py-4 md:py-8" :class="isDualLanguageMode ? 'max-w-full' : 'max-w-4xl'">
    <!-- 双语言模式切换按钮 -->
    <div v-if="canToggleDualLanguageMode" class="mb-4 flex justify-end">
      <button @click="toggleDualLanguageMode"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors" :class="isDualLanguageMode
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-surface-muted text-foreground hover:bg-surface'
          ">
        <ArrowsRightLeftIcon v-if="!isDualLanguageMode" class="w-5 h-5" />
        <XMarkIcon v-else class="w-5 h-5" />
        <span>
          {{
            isDualLanguageMode
              ? $t("article.exitDualLanguageMode")
              : $t("article.dualLanguageMode")
          }}
        </span>
      </button>
    </div>

    <!-- 双语言模式 -->
    <div v-if="isDualLanguageMode && canToggleDualLanguageMode" class="fixed inset-0 z-50 bg-surface flex flex-col">
      <!-- 顶部工具栏 -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <h2 class="text-lg font-semibold text-foreground">
          {{ $t("article.dualLanguageMode") }}
        </h2>
        <button @click="toggleDualLanguageMode"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors">
          <XMarkIcon class="w-5 h-5" />
          <span>{{ $t("article.exitDualLanguageMode") }}</span>
        </button>
      </div>

      <!-- 文章阅读区域（全屏） -->
      <div class="flex-1 flex items-start justify-center gap-4 lg:gap-6 overflow-hidden px-4 min-h-0">
        <DualLanguageArticlePanel :slug="slug" :label="$t('article.leftLanguage')"
          :initial-language="leftLanguageDefault" :sync-scroll="true" :is-left="true" :other-panel-ref="rightPanelRef"
          ref="leftPanelRef" class="flex-1 min-w-0 h-full" />
        <DualLanguageArticlePanel :slug="slug" :label="$t('article.rightLanguage')"
          :initial-language="rightLanguageDefault" :sync-scroll="true" :is-left="false" :other-panel-ref="leftPanelRef"
          ref="rightPanelRef" class="flex-1 min-w-0 h-full" />
      </div>
    </div>

    <!-- 单语言模式 -->
    <div v-else>
      <div v-if="loading" class="text-center py-8 text-muted">
        {{ $t("common.loading") }}
      </div>
      <ReadArticle v-else-if="currentLanguageArticle" :article="currentLanguageArticle" :category-name="categoryName"
        :tag-names="tagNames" :formatted-date="formatDate(currentLanguageArticle.createdAt)" :show-toc="true"
        :article-base-id="currentLanguageArticle.id" :bookmarked="articleBookmarked" :is-logged-in="!!session?.user"
        @update:bookmarked="articleBookmarked = $event" />
      <div v-else-if="showLanguageSwitchHint" class="text-center py-8 space-y-4">
        <p class="text-muted">
          {{ $t("article.currentLanguageVersionUnavailable") }}
        </p>
        <p class="text-muted">
          {{ $t("article.availableLanguageVersionsHint") }}
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <NuxtLink v-for="item in availableLanguageLinks" :key="`${item.languageCode}-${item.slug}`" :to="item.path"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium">
            {{ $t("article.switchToLanguageVersion", { language: item.name }) }}
          </NuxtLink>
        </div>
      </div>
      <div v-else class="text-center py-8 space-y-4">
        <p class="text-muted">
          {{ $t("article.notFound") }}
        </p>
        <NuxtLink :to="localePath('/')"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium">
          {{ $t("article.backToHome") }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowsRightLeftIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import ReadArticle from "~/components/common/ReadArticle.vue";
import DualLanguageArticlePanel from "~/components/common/DualLanguageArticlePanel.vue";

import type { Result, Article } from "~~/utils/models";

import { formatDate } from "~/utils/common";

const route = useRoute();
const { locale, locales, t: $t, te } = useI18n();
const localePath = useLocalePath();
const slug = computed(() => route.params.slug as string);
const { data: session } = useAuth();
// console.log(locale.value);
// 获取当前语言代码（SSR时从路由获取）
const languageCode = computed(() => locale.value || "zh");

// 双语言模式相关
const isDualLanguageMode = ref(false);
const leftPanelRef = ref<InstanceType<typeof DualLanguageArticlePanel> | null>(
  null,
);
const rightPanelRef = ref<InstanceType<typeof DualLanguageArticlePanel> | null>(
  null,
);

// 获取可用语言列表
const availableLocales = computed(() => locales.value);

// 左右两侧的默认语言
const leftLanguageDefault = ref(languageCode.value);
const rightLanguageDefault = computed(() => {
  const currentLang = languageCode.value;
  const otherLang = availableLocales.value.find((l) => l.code !== currentLang);
  return otherLang?.code || availableLocales.value[0]?.code || "en";
});

const toggleDualLanguageMode = () => {
  isDualLanguageMode.value = !isDualLanguageMode.value;
};

const dictionaryStore = useDictionaryStore();
const appStore = useAppStore();
const config = useRuntimeConfig();

// SSR数据获取：根据当前语言code获取文章数据
const { data: articleData, pending: loading } = await useFetch<Result<Article>>(
  () => `/api/articles/${slug.value}`,
  {
    query: computed(() => ({
      languageCode: languageCode.value,
    })),
    watch: [slug, languageCode],
  },
);

const article = computed(() => {
  if (!articleData.value || articleData.value.c !== 200) {
    return null;
  }
  return articleData.value.d || null;
});

const hasCurrentLanguageVersion = computed(() => {
  return (
    !!article.value?.languageCode &&
    article.value.languageCode === languageCode.value
  );
});

const currentLanguageArticle = computed(() => {
  return hasCurrentLanguageVersion.value ? article.value : null;
});

// 收藏状态：仅登录时请求
const articleBaseIdForBookmark = computed(() => currentLanguageArticle.value?.id ?? "");
const { data: bookmarkCheckData } = await useFetch<{ c: number; d?: { bookmarked: boolean } }>(
  () => (session.value?.user && articleBaseIdForBookmark.value ? "/api/entry/bookmarks/check" : null),
  {
    query: () => ({ articleBaseId: articleBaseIdForBookmark.value }),
    watch: [session, articleBaseIdForBookmark],
  }
);
const articleBookmarked = computed(() => bookmarkCheckData.value?.d?.bookmarked ?? false);

const availableTranslations = computed(() => {
  const translations = article.value?.availableTranslations || [];
  const map = new Map<
    string,
    { languageCode: string; slug: string; title: string }
  >();

  for (const item of translations) {
    if (!item?.languageCode || !item?.slug) continue;
    if (!map.has(item.languageCode)) {
      map.set(item.languageCode, item);
    }
  }

  return Array.from(map.values());
});

const getLocaleDisplayName = (code: string) => {
  const nameKey = `article.languageNames.${code}`;
  if (te(nameKey)) {
    return $t(nameKey);
  }

  const targetLocale = availableLocales.value.find((item: any) => {
    return typeof item === "object" && item?.code === code;
  });

  if (targetLocale && typeof targetLocale === "object" && targetLocale.name) {
    return targetLocale.name;
  }

  return code.toUpperCase();
};

const availableLanguageLinks = computed(() => {
  return availableTranslations.value
    .filter((item) => item.languageCode !== languageCode.value)
    .map((item) => ({
      ...item,
      name: getLocaleDisplayName(item.languageCode),
      path: localePath(`/post/${item.slug}`, item.languageCode),
    }));
});

const showLanguageSwitchHint = computed(() => {
  if (loading.value || currentLanguageArticle.value) {
    return false;
  }

  return !!article.value && availableLanguageLinks.value.length > 0;
});

const canToggleDualLanguageMode = computed(() => {
  return !loading.value && !!currentLanguageArticle.value;
});

// 获取分类名称（使用当前用户的语言环境）
const categoryName = computed(() => {
  if (!currentLanguageArticle.value?.categorySlug) return "";
  const currentLang = languageCode.value;
  return dictionaryStore.getCategoryName(
    currentLanguageArticle.value.categorySlug,
    currentLang,
  );
});

// 获取标签名称数组（使用当前用户的语言环境）
const tagNames = computed(() => {
  if (
    !currentLanguageArticle.value?.tagSlugs ||
    currentLanguageArticle.value.tagSlugs.length === 0
  )
    return [];
  const currentLang = languageCode.value;
  return currentLanguageArticle.value.tagSlugs.map((tagSlug) =>
    dictionaryStore.getTagName(tagSlug, currentLang),
  );
});

// 组合 SEO keywords：包含文章原有的 keywords、分类名称和标签名称
const seoKeywords = computed(() => {
  const keywords: string[] = [];

  // 添加文章原有的 SEO keywords
  if (currentLanguageArticle.value?.seoKeyword) {
    // 如果原有 keywords 包含逗号分隔的多个关键词，先分割再添加
    const existingKeywords = currentLanguageArticle.value.seoKeyword
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    keywords.push(...existingKeywords);
  }

  // 添加分类名称
  if (categoryName.value) {
    keywords.push(categoryName.value);
  }

  // 添加标签名称
  if (tagNames.value && tagNames.value.length > 0) {
    keywords.push(...tagNames.value);
  }

  // 去重并返回逗号分隔的字符串
  const uniqueKeywords = Array.from(new Set(keywords));
  return uniqueKeywords.join(",");
});

// 获取站点标题
const siteTitle = computed(() => appStore.siteTitle);

// 获取站点URL（用于生成绝对路径）
const siteUrl = computed(() => {
  if (process.client) {
    return window.location.origin;
  }
  // SSR：从 runtimeConfig 获取
  if (config.public.siteUrl) {
    try {
      const url = new URL(config.public.siteUrl);
      return url.origin;
    } catch {
      return config.public.siteUrl;
    }
  }
  return "";
});

// 将相对路径转换为绝对路径
const getAbsoluteUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  // 如果已经是绝对路径（以 http:// 或 https:// 开头），直接返回
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // 如果是相对路径，添加站点URL前缀
  const baseUrl = siteUrl.value || "";
  // 确保路径以 / 开头
  const path = url.startsWith("/") ? url : `/${url}`;
  return baseUrl + path;
};

// 获取文章封面图片（绝对路径）
const ogImage = computed(() => {
  // 优先使用文章封面图
  if (currentLanguageArticle.value?.featuredImage) {
    return getAbsoluteUrl(currentLanguageArticle.value.featuredImage);
  }
  // 如果没有封面图，使用站点logo
  const settings = appStore.settings;
  if (settings?.logo) {
    return getAbsoluteUrl(settings.logo);
  }
  return "";
});

// 获取文章完整URL
const articleUrl = computed(() => {
  const path = localePath(`/post/${slug.value}`);
  const baseUrl = siteUrl.value || "";
  return baseUrl + path;
});

// 记录文章浏览量（仅在客户端执行，避免重复计数）
const recordArticleView = async () => {
  if (!process.client) return;
  if (!currentLanguageArticle.value) return;

  try {
    // 获取当前页面的完整路径（包含语言前缀）
    const currentPath = route.fullPath || route.path || `/post/${slug.value}`;

    const result = await $fetch<{
      c: number;
      m: string;
      d: { viewCount: number; recorded: boolean };
    }>(`/api/articles/${slug.value}/view`, {
      method: "POST",
      body: {
        uri: currentPath,
      },
    });

    // 如果成功记录，更新本地显示的浏览量
    if (result.c === 200 && result.d && result.d.recorded) {
      // 注意：这里不直接更新 article.value.viewCount，因为 article 是 computed
      // 浏览量会在下次刷新时从服务器获取最新值
    }
  } catch (err) {
    // 静默处理错误，不影响页面加载
    console.error("记录文章浏览量失败:", err);
  }
};

// 页面加载时记录浏览量
onMounted(() => {
  if (process.client && currentLanguageArticle.value) {
    // 延迟一下确保页面已完全加载
    nextTick(() => {
      recordArticleView();
    });
  }
});

// 监听文章数据变化，如果文章加载完成则记录浏览量
watch(
  () => currentLanguageArticle.value,
  (newArticle) => {
    if (process.client && newArticle) {
      nextTick(() => {
        recordArticleView();
      });
    }
  },
  { immediate: false },
);

watch(
  () => canToggleDualLanguageMode.value,
  (canToggle) => {
    if (!canToggle && isDualLanguageMode.value) {
      isDualLanguageMode.value = false;
    }
  },
  { immediate: true },
);
</script>
