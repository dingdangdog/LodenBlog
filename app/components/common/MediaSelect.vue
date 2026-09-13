<template>
  <!-- 媒体选择器弹窗 -->
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        class="bg-surface text-foreground border border-border rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
        @click.stop
      >
        <!-- 头部 -->
        <div
          class="flex items-center justify-between p-6 border-b border-border"
        >
          <h3 class="text-xl font-bold text-foreground">
            {{ $t("admin.media.selectTitle") }}
          </h3>
          <button
            type="button"
            @click="handleCancel"
            class="text-muted hover:text-foreground transition-colors"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- 加载状态 -->
          <div v-if="loading" class="text-center py-12 text-muted">
            {{ $t("common.loading") }}
          </div>

          <!-- 媒体列表 -->
          <div
            v-else-if="mediaList.length"
            class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            <div
              v-for="media in mediaList"
              :key="media.id"
              class="group relative bg-surface-muted rounded-lg overflow-hidden border-2 transition-all cursor-pointer"
              :class="
                isSelected(media.url)
                  ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400'
                  : 'border-border hover:border-blue-300 dark:hover:border-blue-600'
              "
              @click="toggleSelect(media.url)"
            >
              <!-- 选中标记 -->
              <div
                v-if="isSelected(media.url)"
                class="absolute top-2 right-2 z-10 bg-blue-500 text-white rounded-full p-1"
              >
                <CheckIcon class="w-4 h-4" />
              </div>

              <!-- 图片预览 -->
              <div
                class="bg-surface relative overflow-hidden"
              >
                <img
                  :src="media.url"
                  :alt="media.alt || media.originalName"
                  class="w-full h-32 object-contain"
                  @error="handleImageError"
                />
              </div>

              <!-- 信息 -->
              <div class="p-2">
                <p
                  class="text-xs text-foreground truncate"
                  :title="media.originalName"
                >
                  {{ media.originalName }}
                </p>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-12 text-muted">
            {{ $t("common.noMedia") }}
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div
          class="flex items-center justify-between p-6 border-t border-border"
        >
          <div class="text-sm text-muted">
            <span v-if="multiple">
              {{ $t("admin.media.selectedCount") || "已选择" }}:
              {{ selectedUrls.length }}
            </span>
            <span v-else-if="selectedUrls.length">
              {{ $t("admin.media.selected") || "已选择" }}
            </span>
            <span v-else>
              {{ $t("admin.media.notSelected") || "未选择" }}
            </span>
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="handleCancel"
              class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
            >
              {{ $t("common.cancel") }}
            </button>
            <button
              type="button"
              @click="handleConfirm"
              :disabled="selectedUrls.length === 0"
              class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {{ $t("admin.media.actions.confirm") || "确定" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { XMarkIcon, CheckIcon } from "@heroicons/vue/24/outline";
import { api } from "~/utils/api";

const { t } = useI18n();

interface Media {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  alt: string | null;
  caption: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
  uploaderId: string;
}

interface Props {
  /** 是否显示弹窗 */
  modelValue?: boolean;
  /** 是否多选模式 */
  multiple?: boolean;
  /** 已选中的图片链接（用于初始化） */
  selected?: string | string[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  multiple: false,
  selected: () => [],
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [urls: string | string[]];
  cancel: [];
}>();

const visible = ref(props.modelValue);
const mediaList = ref<Media[]>([]);
const loading = ref(false);
const selectedUrls = ref<string[]>([]);

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal;
    if (newVal) {
      // 打开弹窗时，初始化选中状态
      if (props.selected) {
        selectedUrls.value = Array.isArray(props.selected)
          ? [...props.selected]
          : [props.selected];
      } else {
        selectedUrls.value = [];
      }
      loadMedia();
    }
  }
);

// 监听 visible 变化，同步到 modelValue
watch(visible, (newVal) => {
  emit("update:modelValue", newVal);
});

// 加载媒体列表
const loadMedia = async () => {
  try {
    loading.value = true;
    mediaList.value = await api.get<Media[]>("/api/creator/media");
  } catch (error: any) {
    console.error("加载媒体列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 判断是否选中
const isSelected = (url: string): boolean => {
  return selectedUrls.value.includes(url);
};

// 切换选中状态
const toggleSelect = (url: string) => {
  if (props.multiple) {
    // 多选模式
    const index = selectedUrls.value.indexOf(url);
    if (index > -1) {
      selectedUrls.value.splice(index, 1);
    } else {
      selectedUrls.value.push(url);
    }
  } else {
    // 单选模式
    selectedUrls.value = [url];
  }
};

// 确认选择
const handleConfirm = () => {
  if (selectedUrls.value.length === 0) {
    return;
  }

  const result = props.multiple
    ? selectedUrls.value
    : selectedUrls.value[0] || "";

  // 先触发 confirm 事件，让父组件处理
  emit("confirm", result);
  
  // 延迟关闭弹窗，确保事件处理完成
  nextTick(() => {
    visible.value = false;
  });
};

// 取消选择
const handleCancel = () => {
  emit("cancel");
  visible.value = false;
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src =
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3E${encodeURIComponent(t("common.imageLoadFailed"))}%3C/text%3E%3C/svg%3E`;
};

// 暴露方法供外部调用
defineExpose({
  open: () => {
    visible.value = true;
    if (props.selected) {
      selectedUrls.value = Array.isArray(props.selected)
        ? [...props.selected]
        : [props.selected];
    } else {
      selectedUrls.value = [];
    }
    loadMedia();
  },
  close: () => {
    visible.value = false;
  },
});
</script>
