<template>
  <article v-if="article" class="space-y-6">
    <header class="space-y-4">
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
        {{ article.title }}
      </h1>
      <div class="flex items-center gap-2 flex-wrap">
        <p class="text-sm text-primary-600 uppercase tracking-wide">
          {{ formattedDate }}
        </p>
        <NuxtLink v-if="article.categorySlug && categoryName" :to="categoryPath" @click="handleCategoryClick"
          class="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
          {{ categoryName }}
        </NuxtLink>
        <NuxtLink v-for="(tagName, index) in tagNames" :key="article.tagSlugs?.[index]"
          :to="getTagPath(article.tagSlugs?.[index])" @click="handleTagClick(article.tagSlugs?.[index])"
          class="px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
          {{ tagName }}
        </NuxtLink>
      </div>
      <p v-if="article.excerpt" class="text-xs text-gray-500 dark:text-gray-400 italic">
        {{ article.excerpt }}
      </p>
      <!-- 作者信息 -->
      <div v-if="article.author" class="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <NuxtLink v-if="article.author.creatorKey" :to="authorPath" @click="handleAuthorClick"
          class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img v-if="article.author.avatar" :src="normalizeAvatarUrl(article.author.avatar)" :alt="article.author.name"
            class="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
          <div v-else
            class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium">
            {{ article.author.name?.charAt(0)?.toUpperCase() || "?" }}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ article.author.name }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              @{{ article.author.creatorKey }}
            </p>
          </div>
        </NuxtLink>
        <div v-else class="flex items-center gap-3">
          <img v-if="article.author.avatar" :src="normalizeAvatarUrl(article.author.avatar)" :alt="article.author.name"
            class="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
          <div v-else
            class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium">
            {{ article.author.name?.charAt(0)?.toUpperCase() || "?" }}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ article.author.name }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              @{{ article.author.creatorKey }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <div v-if="article.featuredImage" class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <img :src="article.featuredImage" :alt="article.title" class="w-full h-auto object-cover" />
    </div>

    <MarkdownRenderer :content="article.content" :show-catalog="props.showToc"
      :enable-in-article-ads="enableInArticleAds" />

    <!-- 文章结束标识 + 收藏 -->
    <div class="article-end-marker mt-16 mb-8">
      <div class="flex flex-col items-center gap-4">
        <div class="flex items-center justify-center gap-4 w-full">
          <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600">
          </div>
          <!-- <BookmarkIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" /> -->
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">END</span>
          <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600">
          </div>
        </div>
        <!-- 收藏按钮：放在文末，读完后收藏 -->
        <div v-if="articleBaseId" class="flex items-center gap-3">
          <NuxtLink v-if="!isLoggedIn" :to="localePath('/login')"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-surface-muted text-foreground hover:bg-surface border border-border transition-colors">
            <BookmarkIcon class="w-4 h-4" />
            {{ $t("article.bookmarkLoginHint") }}
          </NuxtLink>
          <button v-else type="button" :disabled="bookmarkLoading"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
            :class="bookmarked
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800 hover:bg-primary-200 dark:hover:bg-primary-900/50'
              : 'bg-surface-muted text-foreground hover:bg-surface border-border'
              " @click="toggleBookmark">
            <BookmarkIcon v-if="!bookmarked" class="w-4 h-4" />
            <BookmarkSolidIcon v-else class="w-4 h-4" />
            <span>
              {{ bookmarked ? $t("article.bookmarked") : $t("article.bookmark") }}
              <span v-if="bookmarkCount !== null" class="ml-1 text-xs text-muted">
                ({{ bookmarkCount }})
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <CommentSection v-if="article && !hideComments" :article-base-id="article.id" />
  </article>
</template>

<script setup lang="ts">
import { BookmarkIcon } from "@heroicons/vue/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/vue/24/solid";
import MarkdownRenderer from "~/components/MarkdownRenderer.vue";
import CommentSection from "~/components/common/CommentSection.vue";
import { normalizeAvatarUrl } from "~/utils/avatar";
import type { Article } from "~~/utils/models";

interface Props {
  article: Article | null;
  categoryName?: string;
  tagNames?: string[];
  formattedDate: string;
  hideComments?: boolean; // 是否隐藏评论区
  showToc?: boolean; // 是否显示目录
  articleBaseId?: string; // 文章 base id，用于收藏
  bookmarked?: boolean; // 当前用户是否已收藏
  isLoggedIn?: boolean; // 是否已登录
}

const props = withDefaults(defineProps<Props>(), {
  hideComments: false,
  showToc: false,
  bookmarked: false,
  isLoggedIn: false,
});

const { isEnabled: inArticleAdsEnabled } = useArticleAds();
const enableInArticleAds = inArticleAdsEnabled;

const emit = defineEmits<{
  "click-category": [categorySlug: string];
  "click-tag": [tagSlug: string];
  "click-author": [creatorKey: string];
  "update:bookmarked": [value: boolean];
}>();

const bookmarkLoading = ref(false);
const bookmarked = ref(props.bookmarked);
const bookmarkCount = ref<number | null>(
  props.article?.bookmarkCount ?? null
);

watch(
  () => props.bookmarked,
  (v) => {
    bookmarked.value = v;
  },
  { immediate: true }
);

const toggleBookmark = async () => {
  if (!props.articleBaseId || bookmarkLoading.value) return;
  bookmarkLoading.value = true;
  try {
    if (bookmarked.value) {
      await $fetch(`/api/entry/bookmarks/${props.articleBaseId}`, {
        method: "DELETE",
      });
      bookmarked.value = false;
      emit("update:bookmarked", false);
      if (bookmarkCount.value !== null && bookmarkCount.value > 0) {
        bookmarkCount.value -= 1;
      }
    } else {
      await $fetch("/api/entry/bookmarks", {
        method: "POST",
        body: { articleBaseId: props.articleBaseId },
      });
      bookmarked.value = true;
      emit("update:bookmarked", true);
      if (bookmarkCount.value === null) {
        bookmarkCount.value = 1;
      } else {
        bookmarkCount.value += 1;
      }
    }
  } catch {
    // 错误可 toast 提示，此处保持静默
  } finally {
    bookmarkLoading.value = false;
  }
};

const localePath = useLocalePath();

const categoryPath = computed(() => {
  if (!props.article?.categorySlug) return "";
  return localePath(`/category/${props.article.categorySlug}`);
});

const authorPath = computed(() => {
  if (!props.article?.author?.creatorKey) return "";
  return localePath(`/author/${props.article.author.creatorKey}`);
});

const getTagPath = (tagSlug?: string) => {
  if (!tagSlug) return "";
  return localePath(`/tag/${tagSlug}`);
};

const handleCategoryClick = () => {
  if (props.article?.categorySlug) {
    emit("click-category", props.article.categorySlug);
  }
};

const handleTagClick = (tagSlug?: string) => {
  if (tagSlug) {
    emit("click-tag", tagSlug);
  }
};

const handleAuthorClick = () => {
  if (props.article?.author?.creatorKey) {
    emit("click-author", props.article.author.creatorKey);
  }
};
</script>
