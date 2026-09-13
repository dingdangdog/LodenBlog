<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="visible"
            class="bg-surface text-foreground border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4"
            @click.stop
          >
            <!-- 标题 -->
            <div
              v-if="title"
              class="flex items-center justify-between p-4 border-b border-border"
            >
              <h3 class="text-lg font-semibold text-foreground">
                {{ title }}
              </h3>
              <button
                v-if="showCloseButton"
                type="button"
                @click="handleCancel"
                class="text-muted hover:text-foreground transition-colors"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- 内容 -->
            <div class="p-6">
              <p class="text-sm text-foreground whitespace-pre-line">
                {{ message }}
              </p>
            </div>

            <!-- 操作按钮 -->
            <div
              class="flex items-center justify-end gap-3 p-4 border-t border-border"
            >
              <button
                type="button"
                @click="handleCancel"
                class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
              >
                {{ cancelText || $t("common.cancel") }}
              </button>
              <button
                type="button"
                @click="handleConfirm"
                :disabled="loading"
                class="px-4 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                :class="confirmButtonClass"
              >
                <ArrowPathIcon v-if="loading" class="w-4 h-4 animate-spin" />
                {{ confirmText || $t("common.confirm") }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { XMarkIcon, ArrowPathIcon } from "@heroicons/vue/24/outline";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "default" | "danger" | "warning" | "info";
  showCloseButton?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

const visible = ref(false);
const options = ref<ConfirmOptions | null>(null);
const loading = ref(false);

const title = computed(() => options.value?.title);
const message = computed(() => options.value?.message || "");
const confirmText = computed(() => options.value?.confirmText);
const cancelText = computed(() => options.value?.cancelText);
const showCloseButton = computed(
  () => options.value?.showCloseButton !== false
);

const confirmButtonClass = computed(() => {
  const type = options.value?.type || "default";
  const classMap = {
    default: "bg-primary-600 hover:bg-primary-700",
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-orange-600 hover:bg-orange-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };
  return classMap[type];
});

const show = (opts: ConfirmOptions) => {
  options.value = opts;
  visible.value = true;
};

const hide = () => {
  visible.value = false;
  // 延迟清除选项，等待动画完成
  setTimeout(() => {
    options.value = null;
    loading.value = false;
  }, 200);
};

const handleConfirm = async () => {
  if (loading.value) return;

  if (options.value?.onConfirm) {
    loading.value = true;
    try {
      await options.value.onConfirm();
      hide();
    } catch (error) {
      console.error("确认操作失败:", error);
      // 即使失败也关闭对话框，让调用者处理错误提示
      hide();
    } finally {
      loading.value = false;
    }
  } else {
    hide();
  }
};

const handleCancel = () => {
  if (loading.value) return;

  if (options.value?.onCancel) {
    options.value.onCancel();
  }
  hide();
};

// 监听 ESC 键
if (process.client) {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && visible.value && !loading.value) {
      handleCancel();
    }
  };

  watch(visible, (newVal) => {
    if (newVal) {
      document.addEventListener("keydown", handleEscape);
      // 防止背景滚动
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    }
  });
}

defineExpose({
  show,
  hide,
});
</script>
