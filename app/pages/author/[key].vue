<template>
  <div class="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-6xl">
    <div v-if="loading" class="text-center py-8 text-muted">{{ $t("common.loading") }}</div>
    <div v-else-if="creator" class="space-y-4 md:space-y-8">
      <!-- 创作者信息卡片 -->
      <div
        class="bg-surface text-foreground rounded-xl border border-border p-3 md:p-6"
      >
        <div
          class="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6"
        >
          <!-- 头像 -->
          <div class="flex-shrink-0">
            <img
              v-if="creator.avatar"
              :src="normalizeAvatarUrl(creator.avatar)"
              :alt="creator.penName"
              class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-border"
            />
            <div
              v-else
              class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-surface-muted flex items-center justify-center text-muted text-3xl md:text-4xl font-medium"
            >
              {{ creator.penName?.charAt(0)?.toUpperCase() || "?" }}
            </div>
          </div>

          <!-- 创作者信息 -->
          <div class="flex flex-col items-center md:items-start flex-1 min-w-0">
            <h1
              class="text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              {{ creator.penName }}
            </h1>
            <p class="text-muted mb-4 max-w-xl">
              {{ creator.bio || $t("common.authorEmptyBio") }}
            </p>
            <div
              class="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted"
            >
              <span v-if="stats.totalArticles > 0">
                <span class="font-semibold text-foreground">{{
                  stats.totalArticles
                }}</span>
                {{ $t("common.articles") }}
              </span>
              <span v-if="stats.totalViews > 0">
                <span class="font-semibold text-foreground">{{
                  stats.totalViews
                }}</span>
                {{ $t("common.views") }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 文章列表 -->
      <div>
        <h2
          class="text-xl md:text-2xl font-semibold text-foreground ml-2 mb-3 md:mb-6"
        >
          {{ $t("common.articleList") }}
        </h2>
        <div v-if="articles && articles.length > 0" class="space-y-6">
          <CommonArticleCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
            :category-name="
              article.categorySlug
                ? getCategoryName(article.categorySlug)
                : undefined
            "
            :tag-names="
              article.tagSlugs?.map((tagSlug: string) => getTagName(tagSlug)) ||
              []
            "
          />
        </div>
        <div v-else class="text-center py-12 text-muted">{{ $t("common.noArticles") }}</div>

        <!-- 分页：滑动窗口，避免页码过多 -->
        <div
          v-if="pagination && pagination.totalPages > 1"
          class="mt-6 md:mt-8 flex flex-wrap justify-center items-center gap-1.5 md:gap-2"
        >
          <template v-for="(item, idx) in displayPageItems" :key="idx">
            <button
              v-if="item !== 'ellipsis'"
              @click="goToPage(item as number)"
              :class="[
                'min-w-[2rem] md:min-w-0 px-2.5 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg border transition-colors',
                item === pagination.page
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-surface text-foreground border-border hover:bg-surface-muted',
              ]"
            >
              {{ item }}
            </button>
            <span v-else class="px-1 md:px-2 text-muted text-sm md:text-base">…</span>
          </template>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-8 text-muted">{{ $t("common.creatorNotFound") }}</div>
  </div>
</template>

<script setup lang="ts">
import { normalizeAvatarUrl } from "~/utils/avatar";
import type { Result } from "~~/utils/models";

const route = useRoute();
const { locale } = useI18n();
const localePath = useLocalePath();
const key = computed(() => route.params.key as string);

// 获取当前语言代码（支持 SSR）
const languageCode = computed(() => {
  return locale.value || "zh";
});

const dictionaryStore = useDictionaryStore();

// 分页状态
const currentPage = ref(1);

// 获取创作者信息
const {
  data: creatorData,
  pending: loading,
  refresh,
} = await useFetch<
  Result<{
    creator: any;
    articles: any[];
    stats: {
      totalArticles: number;
      totalViews: number;
    };
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>
>(`/api/author/${key.value}`, {
  query: () => ({
    languageCode: languageCode.value,
    page: currentPage.value,
    pageSize: 10,
  }),
  watch: [languageCode, currentPage],
});

const creator = computed(() => creatorData.value?.d?.creator || null);
const articles = computed(() => creatorData.value?.d?.articles || []);
const stats = computed(
  () => creatorData.value?.d?.stats || { totalArticles: 0, totalViews: 0 }
);
const pagination = computed(() => creatorData.value?.d?.pagination || null);

// 分页展示项：只显示首尾、当前页前后若干页 + 省略号，避免页码按钮过多
const displayPageItems = computed(() => {
  const p = pagination.value;
  if (!p || p.totalPages <= 0) return [];
  const total = p.totalPages;
  const current = p.page;
  const maxVisible = 7; // 最多展示的页码个数（不含省略号）
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  const items: (number | "ellipsis")[] = [];
  if (start > 1) {
    items.push(1);
    if (start > 2) items.push("ellipsis");
  }
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total) {
    if (end < total - 1) items.push("ellipsis");
    items.push(total);
  }
  return items;
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

const formatDate = (date: string | null | undefined) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
};


const goToPage = (page: number) => {
  currentPage.value = page;
  // 滚动到顶部
  if (process.client) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

// SEO 设置
useHead({
  title: computed(
    () => creator.value?.penName || creator.value?.name || $t("common.creatorHome")
  ),
  meta: [
    {
      name: "description",
      content: computed(
        () =>
          creator.value?.bio ||
          `${creator.value?.penName || $t("common.creatorHome")}`
      ),
    },
  ],
});
</script>
