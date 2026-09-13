<template>
  <header ref="headerRef"
    class="bg-surface text-foreground shadow sticky top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out"
    :class="{ '-translate-y-full': isHeaderHidden }">
    <div class="container mx-auto p-2 md:p-4 flex items-center justify-between">
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2">
        <img :src="logoUrl" :alt="appStore.siteTitle" class="h-10 w-auto rounded-full" />
        <span class="text-xl font-bold">
          {{ appStore.siteTitle }}
        </span>
      </NuxtLink>
      <nav class="flex items-center gap-2 md:gap-4">
        <!-- 搜索按钮 -->
        <button @click="showSearchModal = true"
          class="p-2 rounded-md hover:bg-surface-muted transition-colors text-muted hover:text-foreground"
          :title="$t('common.search')">
          <MagnifyingGlassIcon class="w-5 h-5" />
        </button>
        <!-- 语言切换下拉选择 -->
        <AppLanguageSwitcher />
        <AppThemeToggle />
        <AppShareButtons v-if="false" />
        <!-- 登录/注册按钮或用户菜单 -->
        <div v-if="!user" class="flex items-center gap-1 md:gap-2">
          <NuxtLink :to="localePath('/login')"
            class="px-2 py-1 md:px-4 md:py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
            {{ $t("common.login") }}
          </NuxtLink>
          <NuxtLink :to="localePath('/register')"
            class="hidden md:block px-2 py-1 md:px-4 md:py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
            {{ $t("common.register") }}
          </NuxtLink>
        </div>
        <!-- 用户菜单 -->
        <div v-else ref="userMenuRef" class="relative">
          <button @click="showUserMenu = !showUserMenu"
            class="flex items-center gap-1 md:gap-2 p-1 md:p-2 rounded-md hover:bg-surface-muted transition-colors">
            <img v-if="userAvatar" :src="userAvatar" :alt="(user as any)?.name || ''"
              class="w-8 h-8 rounded-full object-cover border border-border" />
            <span v-else
              class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
              {{ ((user as any)?.name || "U").charAt(0).toUpperCase() }}
            </span>
            <span class="text-sm font-medium hidden sm:inline">
              {{ (user as any)?.name }}
            </span>
          </button>
          <!-- 下拉菜单 -->
          <div v-if="showUserMenu"
            class="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 z-50 border border-border">
            <NuxtLink v-if="isCreator || isAdmin" :to="dashboardPath"
              class="block px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors">
              {{ $t("header.user.dashboard") }}
            </NuxtLink>
            <NuxtLink v-if="!isCreator && !isAdmin" :to="localePath('/apply-creator')"
              class="block px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors">
              {{ $t("header.user.applyCreator") }}
            </NuxtLink>
            <NuxtLink :to="localePath('/my')"
              class="block px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors">
              {{ $t("header.user.profile") }}
            </NuxtLink>
            <button @click="showLogoutDialog = true"
              class="block w-full text-left px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors">
              {{ $t("header.user.logout") }}
            </button>
          </div>
        </div>
      </nav>
    </div>

    <!-- 搜索弹窗 -->
    <div v-if="showSearchModal"
      class="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-start justify-center pt-20 md:pt-32"
      @click.self="closeSearchModal">
      <div class="bg-surface text-foreground rounded-2xl shadow-xl w-full max-w-2xl mx-4 border border-border"
        @click.stop>
        <!-- 搜索输入框 -->
        <div class="p-4 border-b border-border">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
            <input ref="searchInputRef" v-model="searchKeyword" type="text"
              :placeholder="$t('common.searchPlaceholder')"
              class="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              @input="handleSearchInput" @keydown.esc="closeSearchModal" @keydown.down.prevent="selectNext"
              @keydown.up.prevent="selectPrev" @keydown.enter.prevent="selectArticle" />
          </div>
          <div class="mt-2 text-xs text-muted flex items-start justify-between gap-3">
            <div v-if="parsedKeywords.length > 1" class="flex flex-wrap gap-1 min-w-0">
              <span v-for="keyword in parsedKeywords" :key="keyword"
                class="px-1.5 py-0.5 rounded bg-surface-muted text-foreground/80">
                {{ keyword }}
              </span>
            </div>
            <span v-else class="min-w-0">{{ $t("common.searchKeywordsHint") }}</span>
            <span class="flex items-center gap-2 shrink-0">
              <kbd class="px-2 py-1 bg-surface-muted rounded text-xs">Esc</kbd>
              <span>{{ $t("common.toClose") }}</span>
            </span>
          </div>
        </div>

        <!-- 搜索结果列表 -->
        <div class="max-h-[60vh] overflow-y-auto">
          <div v-if="searchLoading" class="p-8 text-center text-muted">
            <ArrowPathIcon class="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>{{ $t("common.loading") }}</p>
          </div>
          <div v-else-if="searchResults.length === 0 && searchKeyword.trim()" class="p-8 text-center text-muted">
            <p>{{ $t("common.noResults") }}</p>
          </div>
          <div v-else-if="searchResults.length === 0 && !searchKeyword.trim()" class="p-8 text-center text-muted">
            <p>{{ $t("common.searchKeywordsHint") }}</p>
          </div>
          <div v-else class="divide-y divide-border">
            <button v-for="(article, index) in searchResults" :key="article.id" @click="goToArticle(article)" :class="[
              'w-full text-left px-4 py-3 hover:bg-surface-muted transition-colors',
              selectedIndex === index && 'bg-surface-muted',
            ]">
              <div class="font-medium text-foreground">{{ article.title }}</div>
              <div class="text-xs text-muted mt-1">
                {{ getArticlePath(article) }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 退出登录确认对话框 -->
    <div v-if="showLogoutDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="showLogoutDialog = false">
      <div class="bg-surface text-foreground rounded-lg shadow-xl p-6 w-full max-w-md border border-border" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-foreground">
            {{ $t("common.logout") }}
          </h3>
          <button type="button" @click="showLogoutDialog = false"
            class="text-muted hover:text-foreground transition-colors">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{ $t("common.logoutConfirm") }}
          </p>
          <div class="flex justify-end gap-2">
            <button type="button" @click="showLogoutDialog = false"
              class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
              {{ $t("common.cancel") }}
            </button>
            <button type="button" @click="handleLogout" :disabled="logoutLoading"
              class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
              <ArrowPathIcon v-if="logoutLoading" class="w-4 h-4 animate-spin" />
              {{ $t("common.logout") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { normalizeAvatarUrl } from "~/utils/avatar";
import {
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/vue/24/outline";
import { api } from "~/utils/api";
import { splitSearchKeywords } from "~~/utils/search-keywords";

const localePath = useLocalePath();
const appStore = useAppStore();
const { data: session, signOut } = useAuth();
const authState = useAuthState();
const { isCreator, isAdmin } = usePermission();
const themeStore = useThemeStore();
const dashboardPath = computed(() =>
  isAdmin.value ? localePath("/admin") : localePath("/admin/creator")
);
// 使用 storeToRefs 确保响应式追踪
const { currentMode: themeCurrentMode } = storeToRefs(themeStore);

const user = computed(() => session.value?.user);
const userAvatar = computed(() => normalizeAvatarUrl((user.value as any)?.avatar || ""));
const showUserMenu = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);
const showLogoutDialog = ref(false);
const logoutLoading = ref(false);
const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
  "authjs.csrf-token",
  "next-auth.csrf-token",
  "authjs.callback-url",
  "next-auth.callback-url",
] as const;

// 搜索相关
const showSearchModal = ref(false);
const searchKeyword = ref("");
const searchResults = ref<
  Array<{
    id: string;
    slug: string;
    title: string;
    languageCode: string;
  }>
>([]);
const searchLoading = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(-1);
let searchTimeout: NodeJS.Timeout | null = null;
const parsedKeywords = computed(() => splitSearchKeywords(searchKeyword.value));

// 滚动隐藏/显示相关
const headerRef = ref<HTMLElement | null>(null);
const isHeaderHidden = ref(false);
const lastScrollY = ref(0);
const scrollThreshold = 10; // 滚动阈值，避免微小滚动触发

// 使用 cookie 同步主题状态，确保 SSR 和客户端一致
const themeModeCookie = useCookie<"light" | "dark" | "system">("themeMode", {
  default: () => "light",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

// 在客户端初始化时，优先从 localStorage 读取（持久化），再与 cookie 同步
if (process.client) {
  const localStorageMode = localStorage.getItem("themeMode") as
    | "light"
    | "dark"
    | "system"
    | null;
  const cookieMode = themeModeCookie.value;

  let finalMode: "light" | "dark" | "system" = "light";
  if (
    localStorageMode &&
    ["light", "dark", "system"].includes(localStorageMode)
  ) {
    finalMode = localStorageMode;
  } else if (
    cookieMode &&
    ["light", "dark", "system"].includes(cookieMode)
  ) {
    finalMode = cookieMode;
  }

  if (finalMode !== cookieMode) {
    themeModeCookie.value = finalMode;
  }
  if (themeCurrentMode.value !== finalMode) {
    themeStore.setMode(finalMode);
  }
}

// 同步 store 的变化到 cookie
watch(themeCurrentMode, (newMode) => {
  if (process.client && themeModeCookie.value !== newMode) {
    themeModeCookie.value = newMode;
  }
});

// 根据主题模式选择 logo
// 优先使用 themeCurrentMode（响应式，立即更新），SSR 时使用 cookie 作为后备
const logoUrl = computed(() => {
  // 客户端优先使用 store 中的 currentMode（响应式，立即更新）
  // SSR 时使用 cookie（因为 store 在 SSR 时可能还未初始化）
  const currentMode = process.client
    ? themeCurrentMode.value || themeModeCookie.value || "light"
    : themeModeCookie.value || "light";
  const isDarkMode = currentMode === "dark";

  // 辅助函数：检查字符串是否有效（非空且非空字符串）
  const isValidLogo = (logo: string | null | undefined): boolean => {
    return !!logo && logo.trim() !== "";
  };

  // 优先使用系统配置的 logo（根据主题选择对应的 logo）
  if (isDarkMode) {
    // 暗色主题：优先使用 logoDark，其次使用默认 logo
    if (isValidLogo(appStore.settings?.logoDark)) {
      return appStore.settings!.logoDark!;
    }
    if (isValidLogo(appStore.settings?.logo)) {
      return appStore.settings!.logo;
    }
    // 如果系统配置为空，使用默认的暗色 logo
    return "/logo.dark.webp";
  } else {
    // 浅色主题：优先使用 logoLight，其次使用默认 logo
    if (isValidLogo(appStore.settings?.logoLight)) {
      return appStore.settings!.logoLight!;
    }
    if (isValidLogo(appStore.settings?.logo)) {
      return appStore.settings!.logo;
    }
    // 如果系统配置为空，使用默认的浅色 logo
    return "/logo.light.webp";
  }
});

// 滚动处理函数
const handleScroll = () => {
  if (!process.client) return;

  const currentScrollY = window.scrollY;

  // 如果滚动距离小于阈值，始终显示 header
  if (currentScrollY < scrollThreshold) {
    isHeaderHidden.value = false;
    lastScrollY.value = currentScrollY;
    return;
  }

  // 向下滚动时隐藏，向上滚动时显示
  if (currentScrollY > lastScrollY.value) {
    // 向下滚动
    isHeaderHidden.value = true;
  } else if (currentScrollY < lastScrollY.value) {
    // 向上滚动
    isHeaderHidden.value = false;
  }

  lastScrollY.value = currentScrollY;
};

// 搜索功能
const handleSearchInput = () => {
  selectedIndex.value = -1;
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    performSearch();
  }, 300);
};

const performSearch = async () => {
  const keyword = searchKeyword.value.trim();
  if (!keyword || parsedKeywords.value.length === 0) {
    searchResults.value = [];
    return;
  }

  searchLoading.value = true;
  try {
    const result = await api.get<{
      articles: Array<{
        id: string;
        slug: string;
        title: string;
        languageCode: string;
      }>;
    }>("/api/articles/search", {
      query: { keyword },
    });
    searchResults.value = result.articles || [];
  } catch (error) {
    console.error("搜索失败:", error);
    searchResults.value = [];
  } finally {
    searchLoading.value = false;
  }
};

const getArticlePath = (article: {
  slug: string;
  languageCode: string;
}) => {
  // 根据语言代码构建路径
  // 默认语言（zh）不需要前缀
  if (article.languageCode === "zh") {
    return `/post/${article.slug}`;
  }
  return `/${article.languageCode}/post/${article.slug}`;
};

const goToArticle = (article: {
  slug: string;
  languageCode: string;
}) => {
  const path = getArticlePath(article);
  closeSearchModal();
  navigateTo(path);
};

const closeSearchModal = () => {
  showSearchModal.value = false;
  searchKeyword.value = "";
  searchResults.value = [];
  selectedIndex.value = -1;
};

const selectNext = () => {
  if (selectedIndex.value < searchResults.value.length - 1) {
    selectedIndex.value++;
  }
};

const selectPrev = () => {
  if (selectedIndex.value > 0) {
    selectedIndex.value--;
  }
};

const selectArticle = () => {
  if (
    selectedIndex.value >= 0 &&
    selectedIndex.value < searchResults.value.length
  ) {
    goToArticle(searchResults.value[selectedIndex.value] as { slug: string; languageCode: string });
  } else if (searchResults.value.length > 0) {
    goToArticle(searchResults.value[0] as { slug: string; languageCode: string });
  }
};

// 监听搜索弹窗显示，自动聚焦输入框
watch(showSearchModal, (show) => {
  if (show && process.client) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
});

// 快捷键支持 Ctrl+K / Cmd+K
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    // 关闭用户菜单
    if (
      showUserMenu.value &&
      userMenuRef.value &&
      !userMenuRef.value.contains(target)
    ) {
      showUserMenu.value = false;
    }
  };
  document.addEventListener("click", handleClickOutside);

  // 添加滚动监听
  if (process.client) {
    lastScrollY.value = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  // 快捷键支持
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl+K 或 Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      // 如果搜索弹窗已经打开，则关闭；否则打开
      if (showSearchModal.value) {
        closeSearchModal();
      } else {
        showSearchModal.value = true;
      }
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
    if (process.client) {
      window.removeEventListener("scroll", handleScroll);
    }
    document.removeEventListener("keydown", handleKeyDown);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  });
});

const handleLogout = async () => {
  showUserMenu.value = false;
  logoutLoading.value = true;
  showLogoutDialog.value = false;

  // 后端登出请求异步发起，不阻塞前端退出流程
  void signOut({ redirect: false }).catch((error) => {
    console.error("登出请求失败:", error);
  });

  // 立即清理前端会话状态，避免页面继续认为是已登录
  authState.data.value = null;
  authState.loading.value = false;

  // 立即清理前端可操作的认证 Cookie
  if (process.client) {
    const knownCookieNames = new Set<string>(AUTH_COOKIE_NAMES);
    const existingAuthCookies = document.cookie
      .split(";")
      .map((item) => item.trim().split("=")[0])
      .filter((name) => name.includes("authjs") || name.includes("next-auth"));
    existingAuthCookies.forEach((name) => knownCookieNames.add(name));

    const hostname = window.location.hostname;
    const domainCandidates = new Set<string>([hostname, `.${hostname}`]);
    const hostParts = hostname.split(".");
    if (hostParts.length > 2) {
      domainCandidates.add(`.${hostParts.slice(-2).join(".")}`);
    }

    for (const cookieName of knownCookieNames) {
      document.cookie = `${cookieName}=; Max-Age=0; path=/`;
      for (const domain of domainCandidates) {
        document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${domain}`;
      }
    }
  }

  try {
    // 前端不等待后端结果，直接返回首页
    await navigateTo(localePath("/"), { replace: true });
  } catch (error) {
    console.error("登出错误:", error);
  } finally {
    logoutLoading.value = false;
  }
};
</script>
