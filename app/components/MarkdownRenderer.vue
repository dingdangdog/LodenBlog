<template>
  <!-- 渲染前显示原始 markdown 文本和渲染中提示 -->
  <div v-if="loading" class="markdown-preview-placeholder">
    <div class="text-center mb-4">
      <div class="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <ArrowPathIcon class="animate-spin h-4 w-4" />
        <span>{{ $t("common.rendering") }}</span>
      </div>
    </div>
    <pre v-show="false" class="markdown-raw-text">{{ content || "" }}</pre>
  </div>

  <!-- 渲染完成后显示 markdown 渲染结果 -->
  <div v-else ref="previewContainerRef" class="relative">
    <!-- 桌面端目录（右侧固定，不随主内容滚动） -->
    <aside v-if="shouldShowCatalog" class="hidden 2xl:block fixed right-4 top-24 z-30 w-72"
      :aria-label="$t('article.toc')">
      <div
        class="catalog-panel rounded-xl border border-border bg-surface/90 text-foreground backdrop-blur-sm shadow-xl">
        <div class="px-4 py-3 border-b border-border text-sm font-semibold">
          {{ $t("article.toc") }}
        </div>
        <div class="catalog-scroll-area overflow-y-auto">
          <MdCatalog :editorId="id" :scrollElement="scrollElement" :theme="editorTheme" />
        </div>
      </div>
    </aside>

    <!-- 移动端目录按钮 -->
    <button v-if="shouldShowCatalog" type="button"
      class="2xl:hidden fixed right-4 top-32 z-40 inline-flex items-center gap-2 rounded-full bg-primary-600 text-white px-4 py-2 shadow-lg hover:bg-primary-700 transition-colors"
      @click="isMobileCatalogOpen = true" :aria-label="$t('article.openToc')">
      <Bars3Icon class="w-5 h-5" />
      <!-- <span class="text-sm font-medium">{{ $t("article.toc") }}</span> -->
    </button>

    <!-- 移动端目录抽屉 -->
    <div v-if="shouldShowCatalog && isMobileCatalogOpen" class="2xl:hidden fixed inset-0 z-50" role="dialog"
      aria-modal="true" :aria-label="$t('article.toc')">
      <div class="absolute inset-0 bg-black/40" @click="closeMobileCatalog"></div>
      <aside
        class="absolute right-0 top-0 h-full w-[86vw] max-w-sm bg-surface text-foreground border-l border-border shadow-2xl flex flex-col">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between">
          <span class="text-sm font-semibold">{{ $t("article.toc") }}</span>
          <button type="button"
            class="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
            @click="closeMobileCatalog" :aria-label="$t('article.closeToc')">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-2 py-2" @click="handleMobileCatalogClick">
          <MdCatalog :editorId="id" :scrollElement="scrollElement" :theme="editorTheme" />
        </div>
      </aside>
    </div>

    <MdPreview :id="id" :modelValue="previewContent" preview-theme="github" code-theme="github" :theme="editorTheme"
      @onRemount="handlePreviewRemount" />
  </div>
</template>

<script setup lang="ts">
import { MdPreview, MdCatalog } from "md-editor-v3";
import { useThemeStore } from "~/stores/theme";
import { ArrowPathIcon, Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";
import {
  ARTICLE_ADS_CLASS,
  ARTICLE_ADS_PLACEHOLDER_HTML,
} from "~/composables/useArticleAds";

import "md-editor-v3/lib/preview.css";
import "~/assets/css/fix-md-preview.css";

const { t: $t } = useI18n();

const props = withDefaults(
  defineProps<{
    content?: string | null;
    showCatalog?: boolean;
    /** 开启时会在正文中插入 .article-ads 占位并渲染广告（需配置 runtimeConfig.public.adsClient/adsSlot） */
    enableInArticleAds?: boolean;
  }>(),
  {
    showCatalog: false,
    enableInArticleAds: false,
  },
);

const loading = ref(true);
const themeStore = useThemeStore();
const editorTheme = computed(() => (themeStore.isDark ? "dark" : "light"));

const id = "preview-only";
const scrollElement = ref<HTMLElement>();
const isMobileCatalogOpen = ref(false);
const previewContainerRef = ref<HTMLElement | null>(null);

/** 若启用文内广告且正文中尚无占位，则注入一个 .article-ads 占位（在 <!-- more --> 后或第 2 段后） */
function injectArticleAdsPlaceholder(raw: string): string {
  if (!raw || raw.includes(ARTICLE_ADS_CLASS)) return raw;
  const placeholder = `\n\n${ARTICLE_ADS_PLACEHOLDER_HTML}\n\n`;
  if (raw.includes("<!-- more -->")) {
    return raw.replace(/(\s*<!--\s*more\s*-->)\s*/i, `$1${placeholder}`);
  }
  const blocks = raw.split(/\n\n+/);
  if (blocks.length <= 2) return raw + placeholder;
  blocks.splice(2, 0, ARTICLE_ADS_PLACEHOLDER_HTML);
  return blocks.join("\n\n");
}

const previewContent = computed(() => {
  const raw = props.content || "";
  if (props.enableInArticleAds) {
    return injectArticleAdsPlaceholder(raw);
  }
  return raw;
});

const hasHeadings = computed(() => {
  const markdown = props.content || "";
  return (
    /^#{1,6}\s+.+$/m.test(markdown) || /^.+\n(?:=+|-+)\s*$/m.test(markdown)
  );
});

const shouldShowCatalog = computed(() => {
  return !!props.showCatalog && hasHeadings.value;
});

const closeMobileCatalog = () => {
  isMobileCatalogOpen.value = false;
};

const handleMobileCatalogClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest("a")) {
    closeMobileCatalog();
  }
};

const { scheduleRender, observeAndRender, isEnabled: adsEnabled } =
  useArticleAds();

let stopAdsObserver: (() => void) | undefined;

function stopArticleAdsObserver() {
  stopAdsObserver?.();
  stopAdsObserver = undefined;
}

function canRenderArticleAds() {
  return process.client && props.enableInArticleAds && adsEnabled.value;
}

function startArticleAdsObserver() {
  stopArticleAdsObserver();
  if (!canRenderArticleAds() || !previewContainerRef.value) return;
  stopAdsObserver = observeAndRender(previewContainerRef);
}

function runArticleAds() {
  if (!canRenderArticleAds()) return;
  scheduleRender(previewContainerRef);
}

/** MdPreview 把 HTML 挂进 DOM 之后再灌广告，对应 Vanblog 在页面变化后调用 show_ads */
function handlePreviewRemount() {
  runArticleAds();
}

onMounted(() => {
  scrollElement.value = document.documentElement;
  // 使用 nextTick 确保在下一个渲染周期完成后再隐藏加载状态
  nextTick(() => {
    loading.value = false;
  });
});

watch(
  () =>
    [
      props.content,
      props.enableInArticleAds,
      loading.value,
      adsEnabled.value,
    ] as const,
  () => {
    if (loading.value) {
      stopArticleAdsObserver();
      return;
    }
    startArticleAdsObserver();
    runArticleAds();
  },
  { flush: "post" },
);

watch(
  () => shouldShowCatalog.value,
  (visible) => {
    if (!visible) {
      isMobileCatalogOpen.value = false;
    }
  },
);

watch(
  () => isMobileCatalogOpen.value,
  (open) => {
    if (!process.client) return;
    document.body.style.overflow = open ? "hidden" : "";
  },
);

onBeforeUnmount(() => {
  stopArticleAdsObserver();
  if (process.client) {
    document.body.style.overflow = "";
  }
});
</script>

<style scoped>
/* 强制覆盖 md-editor 的背景颜色 */
.md-editor {
  background-color: transparent !important;
}

/* Markdown 原始文本样式 */
.markdown-preview-placeholder {
  padding: 1rem;
}

.markdown-raw-text {
  font-family:
    "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.catalog-panel {
  max-height: calc(100vh - 7rem);
}

.catalog-scroll-area {
  max-height: calc(100vh - 10rem);
}

:deep(.md-editor-catalog) {
  color: inherit;
  background-color: transparent;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem 0.75rem;
}

:deep(.md-editor-catalog-link) {
  border-radius: 0.375rem;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

:deep(.md-editor-catalog-link:hover) {
  background-color: var(--md-bk-color-outstand);
}

:deep(.md-editor-catalog-link span) {
  color: inherit;
}

:deep(.md-editor-catalog-active > span) {
  font-weight: 600;
}

:deep(.md-editor-catalog-indicator) {
  background-color: rgb(var(--color-primary-600) / 1);
}

.dark .markdown-raw-text {
  color: #d1d5db;
  background-color: #1f2937;
  border-color: #374151;
}
</style>
