<template>
  <div class="flex gap-6 max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8">
    <!-- 左侧固定侧边栏 -->
    <aside class="hidden lg:block w-64 flex-shrink-0">
      <div class="sticky top-8 space-y-3 md:space-y-6">
        <!-- 分类列表 -->
        <div
          v-if="categories.length > 0"
          class="bg-surface text-foreground rounded-xl border border-border p-4"
        >
          <div class="relative mb-3">
            <h3
              class="text-lg font-semibold text-foreground pr-8"
            >
              {{ $t("category.sidebar.title") }}
            </h3>
            <NuxtLink
              v-if="categories.length > 0"
              :to="localePath(`/category/${categories[0]?.slug}`)"
              class="absolute top-0 right-0 p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
              title="查看全部分类"
            >
              <ChevronRightIcon class="w-5 h-5" />
            </NuxtLink>
          </div>
          <ul class="sidebar-scroll space-y-2 max-h-[30vh] overflow-y-auto">
            <li v-for="category in categories" :key="category.slug">
              <NuxtLink
                :to="localePath(`/category/${category.slug}`)"
                class="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted hover:bg-surface-muted transition-colors group"
              >
                <span class="flex items-center gap-2 flex-1 min-w-0">
                  <span v-if="category.icon" class="text-base flex-shrink-0">{{
                    category.icon
                  }}</span>
                  <span
                    v-if="category.color"
                    class="w-2 h-2 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: category.color }"
                  ></span>
                  <span class="truncate">{{ category.name }}</span>
                </span>
                <span
                  class="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-surface-muted text-muted flex-shrink-0"
                >
                  {{ category.count || 0 }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- 标签列表 -->
        <div
          v-if="tags.length > 0"
          class="bg-surface text-foreground rounded-xl border border-border p-4"
        >
          <div class="relative mb-3">
            <h3
              class="text-lg font-semibold text-foreground pr-8"
            >
              {{ $t("tag.sidebar.title") }}
            </h3>
            <NuxtLink
              v-if="tags.length > 0"
              :to="localePath(`/tag/${tags[0]?.slug}`)"
              class="absolute top-0 right-0 p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
              title="查看全部标签"
            >
              <ChevronRightIcon class="w-5 h-5" />
            </NuxtLink>
          </div>
          <ul class="sidebar-scroll space-y-2 max-h-[40vh] overflow-y-auto">
            <li v-for="tag in tags" :key="tag.slug">
              <NuxtLink
                :to="localePath(`/tag/${tag.slug}`)"
                class="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted hover:bg-surface-muted transition-colors group"
              >
                <span class="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    v-if="tag.color"
                    class="w-2 h-2 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: tag.color }"
                  ></span>
                  <span class="truncate">{{ tag.name }}</span>
                </span>
                <span
                  class="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-surface-muted text-muted flex-shrink-0"
                >
                  {{ tag.count || 0 }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div class="flex-1 min-w-0">
      <div v-if="loading" class="text-center py-8 text-muted">
        <ArrowPathIcon class="w-8 h-8 mx-auto mb-2 animate-spin" />
        <p>{{ $t("common.loading") }}</p>
      </div>
      <div
        v-else-if="articles && articles.length > 0"
        class="space-y-4 md:space-y-6"
      >
        <CommonArticleCard
          v-for="article in articles"
          :key="article.id"
          :article="article"
          :category-name="
            article.categorySlug
              ? getCategoryName(article.categorySlug)
              : undefined
          "
          :tag-names="article.tagSlugs?.map((tagSlug: string) => getTagName(tagSlug)) || []"
        />
      </div>
      <div v-else class="text-center py-12 text-muted">
        <DocumentTextIcon
          class="w-12 h-12 mx-auto mb-3 text-muted"
        />
        <p class="font-medium">{{ $t("article.noArticles") }}</p>
      </div>

      <!-- 加载更多指示器 -->
      <div v-if="loadingMore" class="text-center py-8 text-muted">
        <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
        <p>{{ $t("common.loadMore") }}</p>
      </div>
      <div
        v-else-if="hasMore && articles.length > 0"
        ref="loadMoreTrigger"
        class="h-1"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronRightIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  requiresAuth: false, // 公开页面，首页
});

const { locale, t } = useI18n();
const localePath = useLocalePath();

// 获取当前语言代码（支持 SSR）
const languageCode = computed(() => locale.value || "zh");

const dictionaryStore = useDictionaryStore();

// SSR: 使用 await useFetch 加载字典数据，确保 SSR 时也能加载
const { data: dictionariesData } = await useFetch<{
  c: number;
  d: {
    categories: Record<string, Record<string, any>>;
    tags: Record<string, Record<string, any>>;
  };
}>("/api/dictionaries");

const pageSize = 10;

const loading = ref(true);
// SSR: 使用 await useFetch 加载第一页文章数据
const { data: articlesData } = await await useFetch<{
  c: number;
  m: string;
  d: { articles: any[]; pagination: any };
}>("/api/articles", {
  query: computed(() => ({
    languageCode: languageCode.value,
    page: 1,
    pageSize,
  })),
});
loading.value = false;

// SSR: 使用 await useFetch 加载分类和标签统计数据
const { data: categoryCountsData } = await useFetch<{
  c: number;
  d: Record<string, number>;
}>("/api/categories/counts", {
  query: computed(() => ({
    languageCode: languageCode.value,
  })),
});

const { data: tagCountsData } = await useFetch<{
  c: number;
  d: Record<string, number>;
}>("/api/tags/counts", {
  query: computed(() => ({
    languageCode: languageCode.value,
  })),
});

// 处理文章数据
const allArticles = ref<any[]>([]);
const currentPage = ref(1);
const hasMore = ref(true);
const loadingMore = ref(false);

// 从 SSR 数据中提取文章列表
watchEffect(() => {
  if (
    articlesData.value &&
    articlesData.value.c === 200 &&
    articlesData.value.d
  ) {
    allArticles.value = articlesData.value.d.articles || [];
    const pagination = articlesData.value.d.pagination;
    if (pagination) {
      currentPage.value = pagination.page || 1;
      hasMore.value = pagination.page < pagination.totalPages;
    }
  }
});

const articles = computed(() => allArticles.value);

// 处理分类和标签数据
const categories = computed(() => {
  // 优先使用 SSR 加载的字典数据，否则使用 store
  const dictData =
    dictionariesData.value?.c === 200 && dictionariesData.value.d
      ? dictionariesData.value.d
      : null;

  let currentCategories: Array<{
    slug: string;
    name: string;
    icon?: string;
    color?: string;
  }> = [];

  if (dictData) {
    // 从 SSR 数据中获取分类
    const allSlugs = new Set<string>();
    Object.values(dictData.categories || {}).forEach((langCategories) => {
      if (langCategories) {
        Object.keys(langCategories).forEach((slug) => allSlugs.add(slug));
      }
    });

    currentCategories = Array.from(allSlugs).map((slug) => {
      const currentLangData = dictData.categories[languageCode.value]?.[slug];
      const defaultLangData = dictData.categories["zh"]?.[slug];
      const data = currentLangData || defaultLangData || { name: slug };

      return {
        slug,
        name: data.name || slug,
        icon: data.icon,
        color: data.color,
      };
    });
  } else {
    // 回退到使用 store
    currentCategories = dictionaryStore.getCategoriesByLanguage(
      languageCode.value
    );
  }

  const categoryCounts =
    categoryCountsData.value?.c === 200 ? categoryCountsData.value.d || {} : {};

  return currentCategories
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon || undefined,
      color: cat.color || undefined,
      count: categoryCounts[cat.slug] || 0,
    }))
    .filter((cat) => cat.count > 0)
    .sort((a, b) => b.count - a.count);
});

const tags = computed(() => {
  // 优先使用 SSR 加载的字典数据，否则使用 store
  const dictData =
    dictionariesData.value?.c === 200 && dictionariesData.value.d
      ? dictionariesData.value.d
      : null;

  let currentTags: Array<{ slug: string; name: string; color?: string }> = [];

  if (dictData) {
    // 从 SSR 数据中获取标签
    const allSlugs = new Set<string>();
    Object.values(dictData.tags || {}).forEach((langTags) => {
      if (langTags) {
        Object.keys(langTags).forEach((slug) => allSlugs.add(slug));
      }
    });

    currentTags = Array.from(allSlugs).map((slug) => {
      const currentLangData = dictData.tags[languageCode.value]?.[slug];
      const defaultLangData = dictData.tags["zh"]?.[slug];
      const data = currentLangData || defaultLangData || { name: slug };

      return {
        slug,
        name: data.name || slug,
        color: data.color,
      };
    });
  } else {
    // 回退到使用 store
    currentTags = dictionaryStore.getTagsByLanguage(languageCode.value);
  }

  const tagCounts =
    tagCountsData.value?.c === 200 ? tagCountsData.value.d || {} : {};

  return currentTags
    .map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      color: tag.color || undefined,
      count: tagCounts[tag.slug] || 0,
    }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count);
});

// 客户端加载更多文章（用于无限滚动）
const loadArticles = async (page: number, append: boolean = false) => {
  if (loadingMore.value || loading.value) return;

  loadingMore.value = true;

  try {
    const result = await $fetch<{
      c: number;
      m: string;
      d: { articles: any[]; pagination: any };
    }>("/api/articles", {
      query: {
        languageCode: languageCode.value,
        page,
        pageSize,
      },
    });

    if (result.c === 200 && result.d) {
      if (append) {
        allArticles.value.push(...result.d.articles);
      } else {
        allArticles.value = result.d.articles;
      }

      const pagination = result.d.pagination;
      hasMore.value = pagination.page < pagination.totalPages;
      currentPage.value = pagination.page;
    }
  } catch (error) {
    console.error("加载文章失败:", error);
  } finally {
    loadingMore.value = false;
    // 数据加载完成后，重新设置 observer
    if (hasMore.value && articles.value.length > 0) {
      nextTick(() => {
        if (loadMoreTrigger.value && observer) {
          observer.disconnect();
          observer.observe(loadMoreTrigger.value);
        }
      });
    }
  }
};

// 无限滚动：使用 Intersection Observer（仅在客户端）
const loadMoreTrigger = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

// 设置无限滚动 observer
const setupInfiniteScroll = () => {
  if (process.server) return;

  // 先断开旧的 observer
  if (observer) {
    observer.disconnect();
  }

  // 创建新的 observer
  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries[0]?.isIntersecting &&
        hasMore.value &&
        !loadingMore.value &&
        !loading.value
      ) {
        loadArticles(currentPage.value + 1, true);
      }
    },
    {
      rootMargin: "100px",
    }
  );

  // 在下一个 tick 观察 trigger 元素
  nextTick(() => {
    if (loadMoreTrigger.value && hasMore.value && articles.value.length > 0) {
      observer?.observe(loadMoreTrigger.value);
    }
  });
};

onMounted(() => {
  // 设置无限滚动（仅在客户端）
  setupInfiniteScroll();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

// 监听数据变化，重新设置 observer
watch([hasMore, () => articles.value.length], () => {
  if (process.client && hasMore.value && articles.value.length > 0) {
    nextTick(() => {
      if (loadMoreTrigger.value && observer) {
        observer.disconnect();
        observer.observe(loadMoreTrigger.value);
      }
    });
  }
});

// 获取分类名称
const getCategoryName = (categorySlug: string) => {
  const currentLang = languageCode.value;
  return dictionaryStore.getCategoryName(categorySlug, currentLang);
};

// 获取标签名称
const getTagName = (tagSlug: string) => {
  const currentLang = languageCode.value;
  return dictionaryStore.getTagName(tagSlug, currentLang);
};

</script>
