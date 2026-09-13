<template>
  <div class="h-dvh flex overflow-hidden bg-background text-foreground">
    <aside class="hidden md:flex md:w-64 bg-surface border-r border-border flex-shrink-0">
      <nav class="flex-1 p-4 flex flex-col h-full overflow-y-auto">
        <div class="mb-4 flex justify-center items-center">
          <NuxtLink :to="adminDashboardPath" class="flex items-center gap-3 min-w-0">
            <img :src="logoUrl" alt="Logo" class="h-10 rounded-full w-auto flex-shrink-0" />
            <div class="min-w-0">
              <h2 class="text-lg md:text-xl text-foreground leading-tight">
                {{ $t("admin.title") }}
              </h2>
              <p v-if="appVersion" class="mt-0.5 text-[11px] font-mono text-muted/75 tracking-wide">
                {{ appVersion }}
              </p>
            </div>
          </NuxtLink>
        </div>
        <div class="mb-4">
          <a :href="localePath('/')" target="_blank"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors">
            <HomeIcon class="w-5 h-5" />
            <span>{{ $t("admin.backToSite") }}</span>
            <ArrowTopRightOnSquareIcon class="w-4 h-4 ml-auto" />
          </a>
        </div>
        <div class="flex-1 space-y-4">
          <template v-for="(section, sectionIdx) in groupedMenuSections" :key="section.groupKey">
            <div v-if="sectionIdx > 0" class="border-t border-border pt-4" />
            <div>
              <p class="px-3 mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                {{ section.label }}
              </p>
              <ul class="space-y-1">
                <li v-for="item in section.items" :key="item.to">
                  <NuxtLink :to="item.to" @click.prevent="handleMenuClick(item.to)"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors" :class="[
                      isActive(item.to)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-muted hover:bg-surface-muted',
                    ]">
                    <component :is="item.icon" class="w-5 h-5" />
                    <span>{{ item.label }}</span>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </template>
        </div>
        <!-- 主题切换和语言切换按钮 -->
        <div class="mt-auto pt-4 border-t border-border space-y-2">
          <!-- 语言切换（仅当启用语言数 > 1 时显示） -->
          <div v-if="hasMultipleLocales" class="relative" ref="languageMenuRef">
            <button @click="showLanguageMenu = !showLanguageMenu"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors">
              <GlobeAltIcon class="w-5 h-5" />
              <span class="flex-1 text-left">{{ currentLocaleName }}</span>
              <ChevronDownIcon class="w-4 h-4" />
            </button>
            <!-- 下拉菜单 -->
            <div v-if="showLanguageMenu"
              class="absolute bottom-full left-0 mb-2 w-full bg-surface rounded-md shadow-lg py-1 z-50 border border-border">
              <button v-for="loc in enabledLocalesList" :key="loc.code" @click="switchLocale(loc.code)"
                class="w-full text-left px-4 py-2 text-sm transition-colors" :class="currentLocale === loc.code
                  ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/20 font-medium'
                  : 'text-muted hover:bg-surface-muted'
                  ">
                {{ loc.nativeName || loc.name }}
              </button>
            </div>
          </div>
          <!-- 主题切换 -->
          <button @click="toggleTheme"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors"
            :aria-label="isDark ? $t('theme.switchToLight') : $t('theme.switchToDark')
              ">
            <SunIcon v-if="isDark" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
            <span>{{
              isDark ? $t("theme.lightMode") : $t("theme.darkMode")
              }}</span>
          </button>
          <!-- 退出登录 -->
          <button @click="showLogoutDialog = true"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <ArrowRightOnRectangleIcon class="w-5 h-5" />
            <span>{{ $t("common.logout") }}</span>
          </button>
        </div>
      </nav>
    </aside>
    <main class="flex-1 flex flex-col overflow-hidden min-h-0">
      <header class="md:hidden bg-surface border-b border-border px-3 py-2 flex-shrink-0">
        <div class="flex items-center gap-2">
          <button @click="mobileMenuOpen = !mobileMenuOpen"
            class="p-1.5 rounded-md text-muted hover:bg-surface-muted transition-colors flex-shrink-0"
            :aria-label="$t('admin.openMenu')">
            <Bars3Icon class="w-5 h-5" />
          </button>
          <h2 class="text-base md:text-lg font-semibold text-foreground truncate">
            {{ $t("admin.title") }}
          </h2>
        </div>
      </header>

      <!-- 移动端弹出式菜单遮罩 -->
      <Transition name="fade">
        <div v-if="mobileMenuOpen" class="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          @click="mobileMenuOpen = false"></div>
      </Transition>

      <!-- 移动端弹出式菜单抽屉 -->
      <Transition name="slide">
        <aside v-if="mobileMenuOpen"
          class="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col overflow-hidden"
          @click.stop>
          <div class="flex items-center justify-between px-3 py-2 border-b border-border">
            <div class="flex items-center gap-2 min-w-0">
              <img :src="logoUrl" alt="Logo" class="h-7 rounded-full w-auto flex-shrink-0" />
              <div class="min-w-0">
                <h2 class="text-base font-bold text-foreground leading-tight">
                  {{ $t("admin.title") }}
                </h2>
                <p v-if="appVersion" class="text-[10px] font-mono text-muted/75 tracking-wide">
                  {{ appVersion }}
                </p>
              </div>
            </div>
            <button @click="mobileMenuOpen = false"
              class="p-1.5 rounded-lg text-muted hover:bg-surface-muted transition-colors"
              :aria-label="$t('admin.closeMenu')">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <nav class="flex-1 overflow-y-auto px-3 py-2">
            <div class="mb-3">
              <a :href="localePath('/')" target="_blank"
                class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors">
                <HomeIcon class="w-4 h-4" />
                <span>{{ $t("admin.backToSite") }}</span>
                <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5 ml-auto" />
              </a>
            </div>
            <div class="space-y-4">
              <template v-for="(section, sectionIdx) in groupedMenuSections" :key="`mobile-${section.groupKey}`">
                <div v-if="sectionIdx > 0" class="border-t border-border pt-4" />
                <div>
                  <p class="px-2 mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                    {{ section.label }}
                  </p>
                  <ul class="space-y-0.5">
                    <li v-for="item in section.items" :key="`mobile-${item.to}`">
                      <NuxtLink :to="item.to"
                        class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        @click.prevent="
                          () => {
                            handleMenuClick(item.to);
                            mobileMenuOpen = false;
                          }
                        " :class="[
                          isActive(item.to)
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-muted hover:bg-surface-muted',
                        ]">
                        <component :is="item.icon" class="w-4 h-4" />
                        <span>{{ item.label }}</span>
                      </NuxtLink>
                    </li>
                  </ul>
                </div>
              </template>
            </div>
          </nav>

          <!-- 移动版语言切换和主题切换按钮 -->
          <div class="px-3 py-2 border-t border-border space-y-2">
            <!-- 语言切换（仅当启用语言数 > 1 时显示） -->
            <div v-if="hasMultipleLocales" class="relative" ref="mobileLanguageMenuRef">
              <button @click="showMobileLanguageMenu = !showMobileLanguageMenu"
                class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors">
                <GlobeAltIcon class="w-4 h-4" />
                <span class="flex-1 text-left">{{ currentLocaleName }}</span>
                <ChevronDownIcon class="w-3.5 h-3.5" />
              </button>
              <!-- 下拉菜单 -->
              <div v-if="showMobileLanguageMenu"
                class="absolute bottom-full left-0 mb-2 w-full bg-surface rounded-md shadow-lg py-1 z-50 border border-border">
                <button v-for="loc in enabledLocalesList" :key="loc.code" @click="switchLocale(loc.code)"
                  class="w-full text-left px-4 py-2 text-sm transition-colors" :class="currentLocale === loc.code
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/20 font-medium'
                    : 'text-muted hover:bg-surface-muted'
                    ">
                  {{ loc.nativeName || loc.name }}
                </button>
              </div>
            </div>
            <!-- 主题切换 -->
            <button @click="toggleTheme"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-muted hover:bg-surface-muted transition-colors"
              :aria-label="isDark ? $t('theme.switchToLight') : $t('theme.switchToDark')
                ">
              <SunIcon v-if="isDark" class="w-4 h-4" />
              <MoonIcon v-else class="w-4 h-4" />
              <span>{{
                isDark ? $t("theme.lightMode") : $t("theme.darkMode")
                }}</span>
            </button>
            <!-- 退出登录 -->
            <button @click="showLogoutDialog = true"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <ArrowRightOnRectangleIcon class="w-4 h-4" />
              <span>{{ $t("common.logout") }}</span>
            </button>
          </div>
        </aside>
      </Transition>
      <div class="flex-1 overflow-y-auto p-2 md:p-4 bg-background min-h-0">
        <slot></slot>
      </div>
    </main>

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
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { watch } from "vue";
import {
  Squares2X2Icon,
  UserCircleIcon,
  PencilSquareIcon,
  FolderIcon,
  TagIcon,
  PhotoIcon,
  GlobeAltIcon,
  Cog8ToothIcon,
  ArrowPathIcon,
  HomeIcon,
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftIcon,
  LinkIcon,
  UserPlusIcon,
} from "@heroicons/vue/24/outline";
import { ROLE_LEVEL } from "~~/utils/role";
import { usePermission } from "~/composables/usePermission";

const route = useRoute();
const router = useRouter();
const runtimeConfig = useRuntimeConfig();
const appVersion = computed(() => {
  const version = runtimeConfig.public.version;
  return typeof version === "string" ? version.trim() : "";
});
const mobileMenuOpen = ref(false);
const { roleLevel, hasRole, isAdmin } = usePermission();
const themeStore = useThemeStore();
const isDark = computed(() => themeStore.isDark);
const { locale } = useI18n();
const enabledLocales = useEnabledLocales();
const hasMultipleLocales = enabledLocales.hasMultiple;
const enabledLocalesList = enabledLocales.list;
const switchLocalePath = useSwitchLocalePath();
const localePath = useLocalePath();
const { signOut } = useAuth();
const authState = useAuthState();

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

// 语言切换相关
const showLanguageMenu = ref(false);
const languageMenuRef = ref<HTMLElement | null>(null);
const showMobileLanguageMenu = ref(false);
const mobileLanguageMenuRef = ref<HTMLElement | null>(null);

const currentLocale = computed(() => locale.value);
const currentLocaleName = computed(() => {
  const current = enabledLocalesList.value.find(
    (l) => l.code === currentLocale.value
  );
  return current?.nativeName || current?.name || currentLocale.value.toUpperCase();
});

const switchLocale = (localeCode: string) => {
  showLanguageMenu.value = false;
  showMobileLanguageMenu.value = false;
  const path = switchLocalePath(localeCode as "zh" | "en" | "ja" | "de" | "es");
  router.push(path);
};

const toggleTheme = () => {
  themeStore.toggleTheme();
};

// 根据主题模式选择 logo
const logoUrl = computed(() => {
  const appStore = useAppStore();
  // 优先使用主题对应的logo
  if (process.client && themeStore.isDark) {
    if (appStore.settings?.logoDark) {
      return appStore.settings.logoDark;
    }
  } else {
    if (appStore.settings?.logoLight) {
      return appStore.settings.logoLight;
    }
  }
  // 如果没有主题对应的logo，使用默认logo
  if (appStore.settings?.logo) {
    return appStore.settings.logo;
  }
  // 否则使用 public 文件夹中的默认 logo
  // SSR 时默认使用浅色 logo，客户端会根据主题切换
  if (process.client && themeStore.isDark) {
    return "/logo.dark.webp";
  }
  return "/logo.light.webp";
});

const MENU_GROUP_ORDER = ["overview", "content", "translation", "system"] as const;
type MenuGroupKey = (typeof MENU_GROUP_ORDER)[number];

interface MenuItem {
  label: string;
  to: string;
  minRole?: number;
  icon: Component;
  group: MenuGroupKey;
}

const { t } = useI18n();

// group: overview, content, translation, system
// 使用 computed 使菜单名称能够响应语言切换；按分组与逻辑顺序排列
const menuItems = computed<MenuItem[]>(() => [
  {
    label: t("admin.menu.creatorDashboard"),
    to: localePath("/admin/creator"),
    icon: Squares2X2Icon,
    minRole: ROLE_LEVEL.CREATOR,
    group: "content",
  },
  {
    label: t("admin.menu.dashboard"),
    to: localePath("/admin"),
    icon: Squares2X2Icon,
    minRole: ROLE_LEVEL.ADMIN,
    group: "system",
  },
  {
    label: t("admin.menu.posts"),
    to: localePath("/admin/posts"),
    icon: PencilSquareIcon,
    minRole: ROLE_LEVEL.CREATOR,
    group: "content",
  },
  {
    label: t("admin.menu.translationlogs"),
    to: localePath("/admin/translationlogs"),
    icon: ArrowPathIcon,
    minRole: ROLE_LEVEL.CREATOR,
    group: "content",
  },
  {
    label: t("admin.menu.categories"),
    to: localePath("/admin/categories"),
    icon: FolderIcon,
    minRole: ROLE_LEVEL.ADMIN,
    group: "content",
  },
  {
    label: t("admin.menu.tags"),
    to: localePath("/admin/tags"),
    icon: TagIcon,
    minRole: ROLE_LEVEL.ADMIN,
    group: "content",
  },
  {
    label: t("admin.menu.media"),
    to: localePath("/admin/media"),
    icon: PhotoIcon,
    minRole: ROLE_LEVEL.CREATOR,
    group: "content",
  },
  {
    label: t("admin.menu.comment"),
    to: localePath("/admin/comment"),
    icon: ChatBubbleLeftIcon,
    minRole: ROLE_LEVEL.ADMIN,
    group: "content",
  },
  {
    label: t("admin.menu.users"),
    to: localePath("/admin/users"),
    icon: UsersIcon,
    minRole: ROLE_LEVEL.ADMIN,
    group: "system",
  },
  {
    label: t("admin.menu.creatorApplications"),
    to: localePath("/admin/creatorapplications"),
    icon: UserPlusIcon,
    minRole: ROLE_LEVEL.ADMIN,
    group: "system",
  },
  {
    label: t("admin.menu.visit"),
    to: localePath("/admin/visit"),
    icon: ClipboardDocumentListIcon,
    minRole: ROLE_LEVEL.ADMIN,
    group: "system",
  },
  {
    label: t("admin.menu.settings"),
    to: localePath("/admin/settings"),
    icon: Cog8ToothIcon,
    minRole: ROLE_LEVEL.ADMIN,
    group: "system",
  },
]);

// 按分组聚合可见菜单项，仅包含有权限且非空的分组
const groupedMenuSections = computed(() => {
  const visible = menuItems.value.filter((item) =>
    hasRole(item.minRole ?? ROLE_LEVEL.USER)
  );
  const byGroup = new Map<MenuGroupKey, MenuItem[]>();
  for (const item of visible) {
    const list = byGroup.get(item.group) ?? [];
    list.push(item);
    byGroup.set(item.group, list);
  }
  return MENU_GROUP_ORDER.filter((key) => (byGroup.get(key)?.length ?? 0) > 0).map(
    (groupKey) => ({
      groupKey,
      label: t(`admin.menuGroup.${groupKey}`),
      items: byGroup.get(groupKey)!,
    })
  );
});

const adminDashboardPath = computed(() =>
  isAdmin.value ? localePath("/admin") : localePath("/admin/creator")
);

const isActive = (path: string) => {
  const currentPath = route.path;

  // 系统看板 /admin：仅精确匹配，不含 /admin/creator
  if (path === localePath("/admin")) {
    return currentPath === "/admin" || /^\/[a-z]{2}\/admin$/i.test(currentPath);
  }

  // 创作者看板 /admin/creator
  if (path === localePath("/admin/creator")) {
    return currentPath === "/admin/creator" || /^\/[a-z]{2}\/admin\/creator$/i.test(currentPath);
  }

  // 其他路径：完全匹配或以该路径开头
  return currentPath === path || currentPath.startsWith(path + "/");
};

const handleMenuClick = async (path: string) => {
  // console.log("[menu-click]", path);
  await navigateTo(path);
};

// 记录后台访问日志的函数
const recordAdminVisit = () => {
  if (!process.client) return;

  const uri = route.fullPath || route.path || "/";
  // 过滤掉 API 路径，只记录页面访问
  if (uri.startsWith("/api/")) {
    return;
  }

  $fetch("/api/visit/admin", {
    method: "GET",
    query: { uri },
  }).catch((err) => {
    // 静默处理错误，不影响页面加载
    console.error("记录后台访问日志失败:", err);
  });
};

// 点击外部关闭菜单
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    // 关闭桌面端语言菜单
    if (
      showLanguageMenu.value &&
      languageMenuRef.value &&
      !languageMenuRef.value.contains(target)
    ) {
      showLanguageMenu.value = false;
    }

    // 关闭移动端语言菜单
    if (
      showMobileLanguageMenu.value &&
      mobileLanguageMenuRef.value &&
      !mobileLanguageMenuRef.value.contains(target)
    ) {
      showMobileLanguageMenu.value = false;
    }
  };
  document.addEventListener("click", handleClickOutside);

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  // 首次加载时记录
  recordAdminVisit();
});

// 监听路由变化，在切换菜单时也记录
watch(
  () => route.path,
  () => {
    recordAdminVisit();
  }
);

const handleLogout = async () => {
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

<style scoped>
/* 遮罩淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 抽屉滑入滑出动画 */
.slide-enter-active {
  transition: transform 0.3s ease-out;
}

.slide-leave-active {
  transition: transform 0.3s ease-in;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}
</style>
