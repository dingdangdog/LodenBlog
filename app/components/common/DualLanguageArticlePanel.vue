<template>
  <div class="max-w-4xl flex-1 flex flex-col min-w-0 overflow-hidden h-full bg-surface">
    <!-- 语言选择器 -->
    <div class="flex items-center mb-4 pb-3 border-b border-border flex-shrink-0 px-4 pt-4 gap-3 bg-surface">
      <div class="w-40">
        <AppSelect v-model="selectedLanguage" :options="languageOptions" option-value="code" option-label="name"
          :allow-clear="false" />
      </div>
      <label class="text-sm font-medium text-foreground whitespace-nowrap">
        {{ label }}
      </label>
    </div>

    <!-- 文章内容（可滚动区域） -->
    <div ref="scrollContainerRef" class="flex-1 overflow-y-auto overscroll-contain min-h-0">
      <div class="w-full mx-auto px-4 pt-4 pb-8">
        <div v-if="loading" class="text-center py-8 text-muted">
          {{ $t("common.loading") }}
        </div>
        <ReadArticle v-else-if="article" :article="article" :category-name="categoryName" :tag-names="tagNames"
          :formatted-date="formattedDate" :hide-comments="true" />
        <div v-else class="text-center py-8 space-y-4">
          <p class="text-muted">
            {{ $t("article.notFound") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ReadArticle from "~/components/common/ReadArticle.vue";
import AppSelect from "~/components/app/Select.vue";
import type { Result, Article } from "~~/utils/models";
import { formatDate } from "~/utils/common";

interface Props {
  slug: string;
  label: string;
  initialLanguage?: string;
  syncScroll?: boolean; // 是否启用同步滚动
  isLeft?: boolean; // 是否为左侧面板
  otherPanelRef?: any; // 另一个面板的引用（使用 any 避免循环引用）
}

const props = withDefaults(defineProps<Props>(), {
  syncScroll: false,
  isLeft: true,
});

const emit = defineEmits<{
  scroll: [scrollTop: number];
}>();

const { locale, locales, t: $t } = useI18n();
const dictionaryStore = useDictionaryStore();

const scrollContainerRef = ref<HTMLElement | null>(null);
const selectedLanguage = ref(props.initialLanguage || locale.value || "zh");
const isScrolling = ref(false);

// 可用语言列表（包含所有语言）
const availableLocales = computed(() => {
  return locales.value;
});

// 转换为 AppSelect 需要的格式
const languageOptions = computed(() => {
  return availableLocales.value.map((locale) => ({
    code: locale.code,
    name: locale.name,
  }));
});

// 获取文章数据
const {
  data: articleData,
  pending: loading,
  refresh,
} = await useFetch<Result<Article>>(`/api/articles/${props.slug}`, {
  query: {
    languageCode: selectedLanguage,
  },
  watch: [selectedLanguage],
});

const article = computed(() => {
  if (!articleData.value || articleData.value.c !== 200) {
    return null;
  }
  return articleData.value.d || null;
});

// 获取分类名称
const categoryName = computed(() => {
  if (!article.value?.categorySlug) return "";
  return dictionaryStore.getCategoryName(
    article.value.categorySlug,
    selectedLanguage.value
  );
});

// 获取标签名称数组
const tagNames = computed(() => {
  if (!article.value?.tagSlugs || article.value.tagSlugs.length === 0)
    return [];
  return article.value.tagSlugs.map((tagSlug) =>
    dictionaryStore.getTagName(tagSlug, selectedLanguage.value)
  );
});

const formattedDate = computed(() => {
  if (!article.value?.createdAt) return "";
  return formatDate(article.value.createdAt);
});

// 同步滚动到指定比例（0-1之间）
const syncScrollToRatio = (ratio: number) => {
  if (!scrollContainerRef.value || !props.syncScroll) return;
  isScrolling.value = true;
  const container = scrollContainerRef.value;
  const maxScroll = container.scrollHeight - container.clientHeight;

  // 确保比例在有效范围内
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const targetScrollTop = clampedRatio * maxScroll;

  container.scrollTop = targetScrollTop;
  // 使用 nextTick 确保滚动完成后再重置标志
  nextTick(() => {
    setTimeout(() => {
      isScrolling.value = false;
    }, 100);
  });
};

// 获取当前滚动比例（0-1之间）
const getScrollRatio = (): number => {
  if (!scrollContainerRef.value) return 0;
  const container = scrollContainerRef.value;
  const maxScroll = container.scrollHeight - container.clientHeight;
  if (maxScroll <= 0) return 0;
  const ratio = container.scrollTop / maxScroll;
  // 确保比例在有效范围内
  return Math.max(0, Math.min(1, ratio));
};

// 处理滚动事件，实现等比例同步滚动
const handleScroll = () => {
  if (!props.syncScroll || isScrolling.value || !scrollContainerRef.value) {
    return;
  }

  const otherPanel = props.otherPanelRef;
  if (!otherPanel) return;

  const ratio = getScrollRatio();
  // 调用另一个面板的同步滚动方法
  if (otherPanel.syncScrollToRatio) {
    otherPanel.syncScrollToRatio(ratio);
  }
};

// 设置滚动监听
const setupScrollListener = () => {
  if (!props.syncScroll || !scrollContainerRef.value) return;

  // 移除旧的监听器（如果存在）
  scrollContainerRef.value.removeEventListener("scroll", handleScroll);

  // 添加新的监听器
  scrollContainerRef.value.addEventListener("scroll", handleScroll, {
    passive: true,
  });
};

// 设置滚动监听
onMounted(() => {
  // 等待内容加载和另一个面板引用准备好后设置滚动监听
  watch(
    [
      () => props.syncScroll,
      () => article.value,
      () => scrollContainerRef.value,
      () => props.otherPanelRef,
    ],
    () => {
      if (
        props.syncScroll &&
        article.value &&
        scrollContainerRef.value &&
        props.otherPanelRef
      ) {
        // 使用 nextTick 确保 DOM 已更新
        nextTick(() => {
          setupScrollListener();
        });
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (scrollContainerRef.value) {
      scrollContainerRef.value.removeEventListener("scroll", handleScroll);
    }
  });
});

// 暴露方法供父组件调用
defineExpose({
  selectedLanguage,
  syncScrollToRatio,
  getScrollRatio,
  article,
});
</script>
