<template>
  <div class="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-6xl min-h-full">
    <!-- 分类列表 -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        {{ $t("category.title") }}
      </h2>
      <div class="flex flex-wrap gap-2">
        <NuxtLink v-for="category in allCategories" :key="category.slug" :to="localePath(`/category/${category.slug}`)"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            currentCategorySlug === category.slug
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50',
          ]">
          {{ category.name }}
          <span v-if="category.count !== undefined" class="text-xs opacity-75 ml-1">({{ category.count }})</span>
        </NuxtLink>
      </div>
    </div>

    <!-- 文章列表 -->
    <div v-if="loading" class="text-center py-8 text-gray-500">
      <ArrowPathIcon class="w-8 h-8 mx-auto mb-2 animate-spin" />
      <p>{{ $t("common.loading") }}</p>
    </div>
    <div v-else-if="articles && articles.length > 0" class="space-y-6">
      <CommonArticleCard v-for="article in articles" :key="article.id" :article="article" :category-name="article.categorySlug
        ? getCategoryName(article.categorySlug)
        : undefined
        " :tag-names="article.tagSlugs?.map((tagSlug: string) => getTagName(tagSlug)) || []
          " />
    </div>
    <div v-else class="text-center py-12 text-gray-500">
      <DocumentTextIcon class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="font-medium">{{ $t("article.noArticlesInCategory") }}</p>
    </div>

    <!-- 加载更多指示器 -->
    <div v-if="loadingMore" class="text-center py-8 text-gray-500">
      <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
      <p>{{ $t("common.loadMore") }}</p>
    </div>
    <div v-else-if="hasMore && articles.length > 0" ref="loadMoreTrigger" class="h-1"></div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, DocumentTextIcon } from "@heroicons/vue/24/outline";

definePageMeta({
  requiresAuth: false, // 公开页面
});

const route = useRoute();
const { locale, t: $t } = useI18n();
const localePath = useLocalePath();

// 获取当前语言代码（支持 SSR）
const languageCode = computed(() => locale.value || "zh");

// 获取URL中的category slug
const currentCategorySlug = computed(() => route.params.slug as string);

const dictionaryStore = useDictionaryStore();

// SSR: 使用 await useFetch 加载分类数量统计
const { data: categoryCountsData } = await await useFetch<{
  c: number;
  d: Record<string, number>;
}>("/api/categories/counts", {
  query: computed(() => ({
    languageCode: languageCode.value,
  })),
});

const categoryCounts = computed(() => {
  return categoryCountsData.value?.c === 200
    ? categoryCountsData.value.d || {}
    : {};
});

// 获取所有唯一的category slug（从所有语言中提取，使用优化后的方法）
const allCategories = computed(() => {
  // 使用优化后的方法获取所有分类（会自动回退到默认语言）
  const allCategoriesData = dictionaryStore.getCategoriesByLanguage(
    languageCode.value
  );

  // 合并数量统计
  const counts = categoryCounts.value;
  const categories = allCategoriesData
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name || cat.slug,
      color: cat.color || null,
      icon: cat.icon || null,
      count: counts[cat.slug] || 0,
    }))
    .filter((cat) => cat.count > 0) // 只显示有文章的分类
    .sort((a, b) => b.count - a.count); // 按文章数量降序排序

  return categories;
});

// 分页状态
const currentPage = ref(1);
const pageSize = 10;
const allArticles = ref<any[]>([]);
const loadingMore = ref(false);
const hasMore = ref(true);
const loading = ref(true);

// SSR: 使用 await useFetch 加载第一页文章数据
const { data: articlesData } = await await useFetch<{
  c: number;
  m: string;
  d: { articles: any[]; pagination: any };
}>("/api/articles", {
  query: {
    languageCode: languageCode.value,
    categorySlug: currentCategorySlug.value,
    page: 1,
    pageSize,
  }
});

loading.value = false;

// console.log("articlesData", articlesData.value);

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
        categorySlug: currentCategorySlug.value,
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
    console.error($t("loading.loadingFailed"), error);
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

// 无限滚动：使用 Intersection Observer
const loadMoreTrigger = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

// 设置无限滚动 observer
const setupInfiniteScroll = () => {
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

onMounted(async () => {
  // 确保字典数据已加载
  await dictionaryStore.loadDictionaries();

  // 设置无限滚动（await useFetch 会自动处理初始加载）
  setupInfiniteScroll();
});

onUnmounted(() => {
  observer?.disconnect();
});

// 监听数据变化，重新设置 observer
watch([hasMore, () => articles.value.length], () => {
  if (hasMore.value && articles.value.length > 0) {
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


// 获取当前分类名称
const currentCategoryName = computed(() => {
  if (!currentCategorySlug.value) return "";
  return dictionaryStore.getCategoryName(
    currentCategorySlug.value,
    languageCode.value
  );
});

// SEO 设置
useHead({
  title: computed(() => {
    const categoryName = currentCategoryName.value || currentCategorySlug.value;
    const categoryTitle = $t("category.title");
    return categoryName ? `${categoryName} - ${categoryTitle}` : categoryTitle;
  }),
  meta: [
    {
      name: "description",
      content: computed(() => {
        const categoryName =
          currentCategoryName.value || currentCategorySlug.value;
        const counts = categoryCounts.value;
        const articleCount = counts[currentCategorySlug.value] || 0;
        if (categoryName) {
          if (articleCount > 0) {
            return `${categoryName} - ${articleCount}${$t(
              "category.sidebar.articles"
            )}。${$t("category.list")}。`;
          }
          return `${categoryName} - ${$t("category.list")}`;
        }
        return $t("category.list");
      }),
    },
    {
      name: "keywords",
      content: computed(() => {
        const categoryName =
          currentCategoryName.value || currentCategorySlug.value;
        return categoryName
          ? `${categoryName},${$t("category.title")}`
          : $t("category.title");
      }),
    },
  ],
});
</script>
