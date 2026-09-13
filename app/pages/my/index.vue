<template>
  <div class="min-h-full flex flex-col">
    <div class="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-6xl flex-1">
      <!-- Tab 切换 -->
      <div class="flex gap-1 mb-6 border-b border-border">
        <button
          type="button"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeTab === 'profile'
              ? 'bg-surface text-foreground border border-border border-b-0 -mb-px'
              : 'text-muted hover:text-foreground hover:bg-surface-muted'
          ]"
          @click="activeTab = 'profile'"
        >
          {{ $t("my.center.profile") }}
        </button>
        <button
          type="button"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeTab === 'favorites'
              ? 'bg-surface text-foreground border border-border border-b-0 -mb-px'
              : 'text-muted hover:text-foreground hover:bg-surface-muted'
          ]"
          @click="activeTab = 'favorites'"
        >
          {{ $t("my.center.favorites") }}
        </button>
      </div>

      <!-- 个人资料 Tab -->
      <template v-if="activeTab === 'profile'">
      <!-- 个人信息卡片 -->
      <div class="bg-surface text-foreground rounded-lg shadow-md p-6 mb-6 border border-border">
      <div class="flex items-start justify-between mb-4">
        <h2 class="text-xl font-bold text-foreground">
          {{ $t("my.center.profile") }}
        </h2>
        <NuxtLink
          :to="localePath('/my/profile')"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
        >
          <PencilIcon class="w-4 h-4" />
          {{ $t("common.edit") }}
        </NuxtLink>
      </div>

      <div class="flex flex-col md:flex-row gap-6">
        <!-- 头像 -->
        <div class="relative flex-shrink-0">
          <div class="relative">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="user?.name"
              class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-border"
            />
            <div
              v-else
              class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl md:text-5xl font-bold border-4 border-border"
            >
              {{ user?.name?.charAt(0).toUpperCase() || (user as any)?.username?.charAt(0).toUpperCase() || "U" }}
            </div>
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="flex-1">
          <div class="mb-4">
            <h1
              class="text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              {{ (user as any)?.name || (user as any)?.username || "-" }}
            </h1>
            <p class="text-muted text-sm md:text-base mb-2">
              {{ user?.email || "-" }}
            </p>
            <p
              v-if="(user as any)?.username"
              class="text-muted text-sm"
            >
              @{{ (user as any).username }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              :class="[
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                user?.role >= ROLE_LEVEL.ADMIN
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : user?.role >= ROLE_LEVEL.CREATOR
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
              ]"
            >
              {{ getRoleName(user?.role) }}
            </span>
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium flex-shrink-0"
              :class="
                user?.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              "
            >
              {{
                user?.isActive ? $t("profile.active") : $t("profile.inactive")
              }}
            </span>
          </div>
          <!-- 个人简介 -->
          <div class="mb-4">
            <h3 class="text-sm font-medium text-muted mb-2">
              {{ $t("profile.bio") }}
            </h3>
            <p
              v-if="user?.bio"
              class="text-muted text-sm whitespace-pre-wrap"
            >
              {{ user.bio }}
            </p>
            <p
              v-else
              class="text-muted text-sm italic"
            >
              {{ $t("profile.bioPlaceholder") }}
            </p>
          </div>
          <div
            v-if="user?.createdAt"
            class="text-xs text-muted"
          >
            {{ $t("profile.accountCreated") }}: {{ formatDate(user.createdAt) }}
          </div>
        </div>
      </div>
    </div>

      <!-- 创作者信息卡片 -->
      <div
        v-if="user?.role >= ROLE_LEVEL.CREATOR"
        class="bg-surface text-foreground rounded-lg shadow-md p-6 mb-6 border border-border"
      >
      <div class="flex items-start justify-between mb-4">
        <h2 class="text-xl font-bold text-foreground">
          {{ $t("my.center.author") }}
        </h2>
        <NuxtLink
          :to="localePath('/my/author')"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
        >
          <PencilIcon class="w-4 h-4" />
          {{ $t("common.edit") }}
        </NuxtLink>
      </div>

      <div v-if="creator" class="flex flex-col md:flex-row gap-6">
        <!-- 创作者头像 -->
        <div class="relative flex-shrink-0">
          <div class="relative">
            <img
              v-if="creatorAvatarUrl"
              :src="creatorAvatarUrl"
              :alt="creator.penName"
              class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-border"
            />
            <div
              v-else
              class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-green-500 flex items-center justify-center text-white text-4xl md:text-5xl font-bold border-4 border-border"
            >
              {{ creator.penName?.charAt(0).toUpperCase() || "C" }}
            </div>
          </div>
        </div>

        <!-- 创作者信息 -->
        <div class="flex-1">
          <div class="mb-4">
            <h1
              class="text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              {{ creator.penName || "-" }}
            </h1>
            <p
              v-if="creator.key"
              class="text-muted text-sm"
            >
              @{{ creator.key }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              {{ $t("admin.profile.creator.role") }}
            </span>
          </div>
          <!-- 创作者简介 -->
          <div class="mb-4">
            <h3 class="text-sm font-medium text-muted mb-2">
              {{ $t("admin.profile.creator.bio") }}
            </h3>
            <p
              v-if="creator.bio"
              class="text-muted text-sm whitespace-pre-wrap"
            >
              {{ creator.bio }}
            </p>
            <p
              v-else
              class="text-muted text-sm italic"
            >
              {{ $t("admin.profile.creator.bioPlaceholder") }}
            </p>
          </div>
          <div
            v-if="creator.createdAt"
            class="text-xs text-muted"
          >
            {{ $t("admin.profile.creator.createdAt") }}: {{ formatDate(creator.createdAt) }}
          </div>
        </div>
      </div>
      <div
        v-else
        class="text-center py-8 text-muted"
      >
        <p class="mb-4">{{ $t("admin.profile.creator.notSet") }}</p>
        <NuxtLink
          :to="localePath('/my/author')"
          class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          {{ $t("admin.profile.creator.setup") }}
        </NuxtLink>
      </div>
      </div>

      <!-- 功能菜单 -->
      <div class="bg-surface text-foreground rounded-lg shadow-md overflow-hidden border border-border">
        <!-- 修改密码 -->
        <NuxtLink
          :to="localePath('/my/password')"
          class="flex items-center justify-between px-4 py-4 hover:bg-surface-muted transition-colors border-b border-border last:border-b-0"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0"
            >
              <KeyIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="flex flex-col">
              <span class="text-base font-medium text-foreground">
                {{ $t("my.center.password") }}
              </span>
              <span class="text-sm text-muted">
                {{ $t("my.center.passwordDescription") }}
              </span>
            </div>
          </div>
          <ChevronRightIcon class="w-5 h-5 text-muted flex-shrink-0" />
        </NuxtLink>
      </div>
      </template>

      <!-- 我的收藏 Tab -->
      <div v-else class="space-y-4">
        <h2 class="text-xl md:text-2xl font-semibold text-foreground ml-2 mb-3 md:mb-6">
          {{ $t("my.center.favorites") }}
        </h2>
        <div v-if="bookmarksLoading" class="text-center py-8 text-muted">
          {{ $t("common.loading") }}
        </div>
        <div v-else-if="bookmarkArticles.length > 0" class="space-y-4">
          <div
            v-for="article in bookmarkArticles"
            :key="article.id"
            class="relative"
          >
            <CommonArticleCard
              :article="article"
              :category-name="getCategoryName(article.categorySlug)"
              :tag-names="(article.tagSlugs || []).map((s: string) => getTagName(s))"
            />
            <button
              type="button"
              class="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-surface/95 dark:bg-surface/95 border border-border shadow-sm flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
              :disabled="unbookmarkId === article.id"
              :title="$t('article.unbookmark')"
              @click.stop="handleUnbookmark(article.id)"
            >
              <BookmarkSolidIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div v-else class="text-center py-12 text-muted">
          {{ $t("common.noArticles") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ROLE_LEVEL } from "~~/utils/role";
import { normalizeAvatarUrl } from "~/utils/avatar";
import {
  KeyIcon,
  PencilIcon,
  ChevronRightIcon,
} from "@heroicons/vue/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/vue/24/solid";

definePageMeta({
  requiresAuth: true,
  middleware: ["auth"],
});

const { data: session } = useAuth();
const { t: $t, locale } = useI18n();
const localePath = useLocalePath();
const dictionaryStore = useDictionaryStore();
const languageCode = computed(() => (locale.value as string) || "zh");

const activeTab = ref<"profile" | "favorites">("profile");
const unbookmarkId = ref<string | null>(null);

const { data: userResponse } = await useFetch("/api/entry/me");
const userDetail = computed(() => (userResponse.value as any)?.d?.user);

const user = computed(() => {
  if (!userDetail.value) {
    return session.value?.user;
  }
  return userDetail.value;
});

const avatarUrl = computed(() => normalizeAvatarUrl(user.value?.avatar));

// 获取创作者信息（与 author.vue 完全一致的方式）
const { data: creatorResponse, refresh: refreshCreator } = await useFetch(
  "/api/entry/creator",
  {
    default: () => ({ c: 200, m: "success", d: { creator: null } }),
  }
);
const creatorDetail = computed(() => {
  // 检查 API 响应是否成功
  const response = creatorResponse.value as any;
  if (response?.c === 200 && response?.d?.creator) {
    return response.d.creator;
  }
  return null;
});

const creator = computed(() => {
  // 只在用户是创作者时才返回 creator 数据
  if (user.value?.role < ROLE_LEVEL.CREATOR) return null;
  return creatorDetail.value;
});

const creatorAvatarUrl = computed(() =>
  creator.value
    ? normalizeAvatarUrl(creator.value.avatar)
    : null
);

const getRoleName = (role?: number | null) => {
  if (!role || role < ROLE_LEVEL.CREATOR) {
    return $t("profile.roleUser");
  }
  if (role < ROLE_LEVEL.ADMIN) {
    return $t("profile.roleCreator");
  }
  return $t("profile.roleAdmin");
};

const formatDate = (date: any) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

// 收藏列表（仅在我的收藏 tab 时请求）
const bookmarkPage = ref(1);
const bookmarksQuery = computed(() =>
  activeTab.value === "favorites"
    ? { languageCode: languageCode.value, page: bookmarkPage.value, pageSize: 10 }
    : null
);
const { data: bookmarksData, pending: bookmarksLoading, refresh: refreshBookmarks } = await useFetch<{
  c: number;
  d?: { articles: any[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
}>(
  () => (activeTab.value === "favorites" ? "/api/entry/bookmarks" : null),
  {
    query: bookmarksQuery,
    watch: [activeTab, bookmarkPage, languageCode],
    default: () => ({ c: 200, d: { articles: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } } }),
  }
);

const bookmarkArticles = computed(() => {
  const d = bookmarksData.value as any;
  if (d?.c === 200 && d?.d?.articles) return d.d.articles;
  return [];
});

const getCategoryName = (categorySlug: string | null | undefined) => {
  if (!categorySlug) return undefined;
  return dictionaryStore.getCategoryName(categorySlug, languageCode.value);
};

const getTagName = (tagSlug: string) => {
  return dictionaryStore.getTagName(tagSlug, languageCode.value);
};

const handleUnbookmark = async (articleBaseId: string) => {
  if (unbookmarkId.value) return;
  unbookmarkId.value = articleBaseId;
  try {
    await $fetch(`/api/entry/bookmarks/${articleBaseId}`, { method: "DELETE" });
    await refreshBookmarks();
  } finally {
    unbookmarkId.value = null;
  }
};
</script>
