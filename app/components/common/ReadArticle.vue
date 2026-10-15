<template>
  <article v-if="article" class="space-y-6">
    <header class="space-y-4">
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
        <!-- <CommonArticleAccessBadge :access-type="article.accessType" size="lg"
          class="mr-3 -translate-y-1 align-middle" /> -->
        <span class="align-middle">{{ article.title }}</span>
      </h1>
      <div v-if="isGated" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm"
        :class="accessTone.panel">
        <component :is="article.locked ? LockClosedIcon : LockOpenIcon" class="h-4 w-4 shrink-0"
          :class="accessTone.icon" />
        <span class="font-medium text-foreground">{{ accessStatusText }}</span>
        <NuxtLink v-if="article.column?.slug && article.column.title" :to="localePath(`/column/${article.column.slug}`)"
          class="inline-flex items-center gap-1 text-muted hover:text-primary-600 transition-colors">
          <RectangleStackIcon class="h-4 w-4" />
          {{ $t("column.inColumn", { title: article.column.title }) }}
        </NuxtLink>
      </div>
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

    <div :class="{ 'preview-fade': hasPreview }">
      <MarkdownRenderer :content="article.content" :show-catalog="props.showToc && !article.locked"
        :enable-in-article-ads="enableInArticleAds && !article.locked" />
    </div>

    <template v-if="article.locked">
      <div v-if="hasPreview" class="flex items-center gap-4" aria-hidden="true">
        <div class="h-px flex-1 bg-gradient-to-r from-transparent to-border"></div>
        <span class="text-xs font-medium tracking-wide text-muted">{{ $t("column.previewEnd") }}</span>
        <div class="h-px flex-1 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      <section class="rounded-2xl border bg-surface px-5 py-8 md:px-10 text-center shadow-sm"
        :class="accessTone.border">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" :class="accessTone.panel">
          <LockClosedIcon class="h-6 w-6" :class="accessTone.icon" />
        </div>
        <h2 class="text-lg md:text-xl font-semibold text-foreground">
          {{ article.lockReason === "UNPAID" ? $t("column.paywallPaid") : $t("column.paywallColumn") }}
        </h2>
        <p v-if="article.lockReason === 'EXPIRED'" class="mx-auto mt-2 max-w-md text-sm text-muted">
          {{ $t("column.paywallExpired", { date: formatLockDate(article.subscriptionExpiresAt) }) }}
        </p>
        <p v-else-if="article.lockReason === 'COLUMN_UNPUBLISHED'" class="mx-auto mt-2 max-w-md text-sm text-muted">
          {{ $t("column.paywallUnpublished") }}
        </p>
        <CommonRedeemCodeForm v-if="canRedeem" class="mx-auto mt-5 max-w-md text-left"
          @success="refreshNuxtData()" />
        <div v-if="externalLinks.length" class="mx-auto mt-6 max-w-md text-left">
          <div class="mb-3 flex items-center gap-3 text-xs text-muted">
            <span class="h-px flex-1 bg-border"></span>
            <span>{{ canRedeem ? $t("column.externalLinksOr") : $t("column.externalLinksTitle") }}</span>
            <span class="h-px flex-1 bg-border"></span>
          </div>
          <ul class="space-y-2">
            <li v-for="(link, index) in externalLinks" :key="`${index}-${link.url}`">
              <a :href="link.url" target="_blank" rel="noopener noreferrer nofollow"
                class="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary-300 hover:bg-surface-muted dark:hover:border-primary-500/40">
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium text-foreground">{{ link.name }}</span>
                  <span v-if="link.description" class="mt-0.5 block break-words text-xs text-muted">
                    {{ link.description }}
                  </span>
                </span>
                <ArrowTopRightOnSquareIcon
                  class="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-primary-600" />
              </a>
            </li>
          </ul>
        </div>
        <NuxtLink v-if="article.column?.slug" :to="localePath(`/column/${article.column.slug}`)"
          class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
          <RectangleStackIcon class="h-4 w-4" />
          {{ article.column.title || $t("column.viewColumn") }}
          <ChevronRightIcon class="h-4 w-4" />
        </NuxtLink>
      </section>
    </template>

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
import {
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  LockClosedIcon,
  LockOpenIcon,
  RectangleStackIcon,
} from "@heroicons/vue/20/solid";
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

function formatLockDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "";
}

const { t } = useI18n();

const isGated = computed(() => {
  const type = props.article?.accessType;
  return type === "PAID" || type === "COLUMN";
});

const hasPreview = computed(() => !!props.article?.locked && !!props.article.content?.trim());

const canRedeem = computed(() => props.article?.lockReason !== "COLUMN_UNPUBLISHED");
const externalLinks = computed(() => props.article?.externalLinks ?? []);

const accessTone = computed(() =>
  props.article?.accessType === "PAID"
    ? {
      panel: "bg-amber-50 dark:bg-amber-500/10",
      icon: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/30",
    }
    : {
      panel: "bg-primary-50 dark:bg-primary-500/10",
      icon: "text-primary-600 dark:text-primary-400",
      border: "border-primary-200 dark:border-primary-500/30",
    },
);

const accessStatusText = computed(() => {
  const article = props.article;
  if (!article) return "";
  if (article.locked) return t("column.previewing");
  if (article.subscriptionExpiresAt) {
    return t("column.subscribedUntil", { date: formatLockDate(article.subscriptionExpiresAt) });
  }
  return t("column.fullAccess");
});

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

<style scoped>
.preview-fade {
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 8rem), transparent);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 8rem), transparent);
}
</style>
