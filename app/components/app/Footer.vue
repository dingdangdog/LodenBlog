<template>
  <footer
    class="fixed bottom-0 left-0 right-0 z-40 bg-surface-muted border-t border-border transition-transform duration-300 ease-in-out"
    :class="{ 'translate-y-full': isFooterHidden }">
    <!-- 移动端单行横向滚动，控制高度；桌面端可换行 -->
    <div class="w-full px-2 py-1.5 md:px-3 md:py-2 overflow-x-auto overflow-y-hidden">
      <div
        class="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-x-2 gap-y-0 md:gap-x-4 md:gap-y-1 text-[11px] md:text-xs text-muted min-h-[28px] md:min-h-0">
        <!-- 信息页链接 -->
        <template v-for="(link, i) in footerInfoLinks" :key="link.slug">
          <span v-if="i > 0" class="text-border flex-shrink-0">·</span>
          <NuxtLink :to="localePath(`/info/${link.slug}`)"
            class="hover:text-foreground transition-colors whitespace-nowrap flex-shrink-0">
            {{ link.title }}
          </NuxtLink>
        </template>
        <template v-if="footerInfoLinks?.length > 0 && ((friendLinksPayload?.list?.length ?? 0) > 0 || showMoreLinks)">
          <span class="text-border flex-shrink-0">|</span>
        </template>
        <!-- 友链（前 N 条 + 更多） -->
        <template v-if="(friendLinksPayload?.list?.length ?? 0) > 0 || showMoreLinks">
          <template v-for="link in friendLinksPayload?.list" :key="link.id">
            <a :href="link.url" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center gap-0.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap flex-shrink-0">
              <img v-if="link.icon" :src="link.icon" :alt="link.name"
                class="w-3 h-3 md:w-3.5 md:h-3.5 rounded object-contain" />
              <span>{{ link.name }}</span>
            </a>
          </template>
          <NuxtLink v-if="showMoreLinks" :to="localePath('/links')"
            class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap flex-shrink-0">
            {{ $t("footer.links.moreLinks") || "更多友链" }}
          </NuxtLink>
          <span class="text-border flex-shrink-0">|</span>
        </template>
        <!-- 版权 -->
        <ClientOnly>
          <span class="whitespace-nowrap flex-shrink-0">
            &copy; {{ new Date().getFullYear() }} {{ appStore.siteTitle }}. {{ $t("footer.rights") }}
          </span>
        </ClientOnly>
        <!-- 开源仓库 -->
        <a
          :href="GITHUB_REPO_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center p-0.5 md:p-1 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors flex-shrink-0"
          :aria-label="$t('footer.social.github')"
          :title="$t('footer.social.github')"
        >
          <svg class="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      </div>
    </div>
  </footer>
  <!-- 占位：移动端更矮，避免遮挡过多正文 -->
  <div class="h-7 md:h-9 flex-shrink-0" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import type { FooterInfoItem } from "~/stores/footerInfo";

const localePath = useLocalePath();
const appStore = useAppStore();
const { locale } = useI18n();
const footerInfoStore = useFooterInfoStore();

const FOOTER_LINKS_LIMIT = 6;
const GITHUB_REPO_URL = "https://github.com/dingdangdog/LodenBlog";

const { data: infoData } = await useFetch<{ c: number; d: FooterInfoItem[] }>(
  "/api/info",
  { key: "footer-info-pages" }
);
watch(
  () => infoData.value,
  (v) => {
    if (v?.c === 200 && Array.isArray(v.d)) footerInfoStore.setCache(v.d);
  },
  { immediate: true }
);

const { data: linksResponse } = await useFetch<{ c: number; d: { list: { id: string; name: string; url: string; icon: string | null }[]; total: number } }>(
  "/api/links",
  { query: { limit: FOOTER_LINKS_LIMIT }, key: "footer-friend-links" }
);

const friendLinksPayload = computed(() => linksResponse.value?.c === 200 ? linksResponse.value.d : null);
const showMoreLinks = computed(() => {
  const p = friendLinksPayload.value;
  return p && p.total > FOOTER_LINKS_LIMIT;
});

const footerInfoLinks = computed(() => footerInfoStore.getLinks(locale.value));

// 滚动显隐：下滑隐藏，上滑显示（与页头相反）
const isFooterHidden = ref(false);
const lastScrollY = ref(0);
const scrollThreshold = 10;

const handleScroll = () => {
  if (!process.client) return;
  const currentScrollY = window.scrollY;
  const docHeight = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  // 顶部：显示页脚（与页头一致）
  if (currentScrollY < scrollThreshold) {
    isFooterHidden.value = false;
    lastScrollY.value = currentScrollY;
    return;
  }

  // 接近底部：不弹出页脚，避免遮挡正文（尤其移动端）
  if (docHeight > scrollThreshold && currentScrollY >= docHeight - scrollThreshold) {
    isFooterHidden.value = true;
    lastScrollY.value = currentScrollY;
    return;
  }

  if (currentScrollY > lastScrollY.value) {
    isFooterHidden.value = true;
  } else if (currentScrollY < lastScrollY.value) {
    isFooterHidden.value = false;
  }
  lastScrollY.value = currentScrollY;
};

onMounted(() => {
  if (!footerInfoStore.cache) footerInfoStore.fetch();
  if (process.client) {
    lastScrollY.value = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener("scroll", handleScroll);
  }
});
</script>
