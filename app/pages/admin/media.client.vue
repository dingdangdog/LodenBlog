<template>
  <div class="space-y-8">
    <!-- 媒体管理 -->
    <section
      class="bg-surface text-foreground rounded-2xl border border-border p-6"
    >
      <div class="flex items-center space-x-4 mb-6">
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t("admin.media.title") }}
        </h2>
        <div class="flex items-center gap-4">
          <button
            @click="scanArticles"
            :disabled="scanning"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{
              scanning
                ? $t("admin.media.scanning")
                : $t("admin.media.scanArticles")
            }}
          </button>
          <label
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="hidden"
              :disabled="uploading"
            />
            {{
              uploading ? $t("admin.media.uploading") : $t("admin.media.upload")
            }}
          </label>
        </div>
      </div>

      <!-- 上传区域 -->
      <div
        v-if="!mediaList.length && !loading"
        class="border-2 border-dashed border-border rounded-lg p-12 text-center"
        @drop.prevent="handleDrop"
        @dragover.prevent
        @dragenter.prevent
      >
        <p class="text-muted mb-4">
          {{ $t("admin.media.dropZone.text") }}
        </p>
        <p class="text-sm text-muted">
          {{ $t("admin.media.dropZone.hint") }}
        </p>
      </div>

      <!-- 媒体列表 -->
      <div v-if="loading" class="text-center py-8 text-muted">
        {{ $t("admin.media.loading") }}
      </div>

      <div
        v-else-if="mediaList.length"
        class="max-h-[80vh] overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        <div class="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 p-2">
          <div
            v-for="media in mediaList"
            :key="media.id"
            class="group relative bg-surface-muted rounded-lg overflow-hidden border border-border hover:border-blue-500 transition-colors"
          >
            <!-- 图片预览 -->
            <div class="bg-surface relative overflow-hidden">
              <img
                :src="media.url"
                :alt="media.alt || media.originalName"
                class="w-full h-36 object-contain"
                @error="handleImageError"
              />
              <!-- 操作按钮 -->
              <div
                class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all flex items-center justify-center gap-2 p-2 opacity-0 group-hover:opacity-100"
              >
                <button
                  @click.stop="copyUrl(media)"
                  class="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  :title="$t('admin.media.actions.copyUrl')"
                >
                  <LinkIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="copyMarkdown(media)"
                  class="p-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  :title="$t('admin.media.actions.copyMarkdown')"
                >
                  <DocumentTextIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="editMedia(media)"
                  class="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  :title="$t('admin.media.actions.edit')"
                >
                  <PencilSquareIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="deleteMedia(media)"
                  class="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  :title="$t('admin.media.actions.delete')"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
            <!-- 信息 -->
            <div class="p-3">
              <p
                class="text-sm text-foreground truncate mb-1"
                :title="media.originalName"
              >
                {{ media.originalName }}
              </p>
              <p class="text-xs text-muted">
                {{ formatFileSize(media.size) }} ·
                {{ formatDate(media.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-muted">
        {{ $t("admin.media.empty") }}
      </div>
    </section>

    <!-- 消息提示 -->
    <div
      v-if="message.text"
      :class="[
        'fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all',
        messageClass,
      ]"
    >
      {{ message.text }}
    </div>

    <!-- 编辑模态框 -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div
          class="bg-surface text-foreground rounded-2xl p-6 w-full max-w-md mx-4 border border-border"
          @click.stop
        >
          <h3 class="text-xl font-bold text-foreground mb-4">
            {{ $t("admin.media.modal.edit") }}
          </h3>

          <div class="mb-4">
            <img
              :src="editingMedia?.url"
              :alt="editingMedia?.originalName"
              class="w-full h-48 object-cover rounded-lg"
            />
          </div>

          <form @submit.prevent="saveMedia" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              {{ $t("admin.media.modal.filename") }}
            </label>
            <input
              :value="editingMedia?.originalName"
              type="text"
              disabled
              class="w-full px-3 py-2 border border-border rounded-lg bg-surface-muted text-muted cursor-not-allowed"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              {{ $t("admin.media.modal.alt") }}
            </label>
            <input
              v-model="mediaForm.alt"
              type="text"
              class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
              :placeholder="$t('admin.media.modal.altPlaceholder')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              {{ $t("admin.media.modal.caption") }}
            </label>
            <textarea
              v-model="mediaForm.caption"
              rows="3"
              class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
              :placeholder="$t('admin.media.modal.captionPlaceholder')"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ $t("admin.media.actions.save") }}
            </button>
            <button
              type="button"
              @click="showEditModal = false"
              class="flex-1 px-4 py-2 bg-surface-muted text-foreground rounded-lg hover:bg-surface-muted/70 transition-colors"
            >
              {{ $t("admin.media.actions.cancel") }}
            </button>
          </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { api } from "~/utils/api";
import { useConfirm } from "~/composables/useConfirm";
import {
  LinkIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
const { t } = useI18n();
const { showConfirm } = useConfirm();

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "creator"],
});

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

const mediaList = ref<Media[]>([]);
const loading = ref(false);
const uploading = ref(false);
const scanning = ref(false);
const showEditModal = ref(false);
const editingMedia = ref<Media | null>(null);

const mediaForm = ref({
  alt: "",
  caption: "",
});

// 消息提示
const message = reactive({
  text: "",
  type: "success" as "success" | "error",
});

const messageClass = computed(() =>
  message.type === "success"
    ? "bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
    : "bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
);

const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.text = text;
  message.type = type;
  setTimeout(() => {
    message.text = "";
  }, 4000);
};

// 加载数据
const loadMedia = async () => {
  try {
    loading.value = true;
    mediaList.value = await api.get<Media[]>("/api/creator/media");
  } catch (error: any) {
    console.error("加载媒体列表失败:", error);

    setMessage(error.message || t("admin.media.messages.loadFailed"), "error");
  } finally {
    loading.value = false;
  }
};

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    await uploadFile(file);
    target.value = ""; // 重置 input
  }
};

// 处理拖拽上传
const handleDrop = async (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (file) {
    await uploadFile(file);
  }
};

// 上传文件
const uploadFile = async (file: File) => {
  // 验证文件类型
  if (!file.type.startsWith("image/")) {
    setMessage(t("admin.media.messages.uploadImageOnly"), "error");
    return;
  }

  // 验证文件大小
  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeInBytes) {
    setMessage(t("admin.media.messages.fileTooLarge"), "error");
    return;
  }

  try {
    uploading.value = true;
    const formData = new FormData();
    formData.append("file", file);

    const media = await api.upload<Media>("/api/creator/media", formData);
    await loadMedia();

    setMessage(t("admin.media.messages.uploadSuccess"), "success");
  } catch (error: any) {
    console.error("上传失败:", error);
    setMessage(
      error.message || t("admin.media.messages.uploadFailed"),
      "error"
    );
  } finally {
    uploading.value = false;
  }
};

// 编辑媒体
const editMedia = (media: Media) => {
  editingMedia.value = media;
  mediaForm.value = {
    alt: media.alt || "",
    caption: media.caption || "",
  };
  showEditModal.value = true;
};

// 保存媒体
const saveMedia = async () => {
  if (!editingMedia.value) return;

  try {
    await api.patch(`/api/creator/media/${editingMedia.value.id}`, {
      alt: mediaForm.value.alt || null,
      caption: mediaForm.value.caption || null,
    });
    showEditModal.value = false;
    editingMedia.value = null;
    await loadMedia();
    setMessage(t("admin.media.messages.saveSuccess"), "success");
  } catch (error: any) {
    console.error("保存失败:", error);
    setMessage(error.message || t("admin.media.messages.saveFailed"), "error");
  }
};

// 删除媒体
const deleteMedia = async (media: Media) => {
  const confirmed = await showConfirm({
    title: t("admin.media.actions.delete"),
    message: t("admin.media.messages.deleteConfirm", {
      name: media.originalName,
    }),
    type: "danger",
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
  });

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/api/creator/media/${media.id}`);
    await loadMedia();
    setMessage(t("admin.media.messages.deleteSuccess"), "success");
  } catch (error: any) {
    console.error("删除失败:", error);
    setMessage(
      error.message || t("admin.media.messages.deleteFailed"),
      "error"
    );
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3E${encodeURIComponent(
    t("common.imageLoadFailed")
  )}%3C/text%3E%3C/svg%3E`;
};

// 复制URL
const copyUrl = async (media: Media) => {
  try {
    await navigator.clipboard.writeText(media.url);
    setMessage(t("admin.media.messages.copySuccess"), "success");
  } catch (err: any) {
    // 如果 Clipboard API 不可用，使用备用方法
    try {
      const textArea = document.createElement("textarea");
      textArea.value = media.url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setMessage(t("admin.media.messages.copySuccess"), "success");
    } catch (fallbackErr: any) {
      setMessage(t("admin.media.messages.copyFailed"), "error");
    }
  }
};

// 复制Markdown链接
const copyMarkdown = async (media: Media) => {
  const altText = media.alt || media.originalName;
  const markdown = `![${altText}](${media.url})`;

  try {
    await navigator.clipboard.writeText(markdown);
    setMessage(t("admin.media.messages.copySuccess"), "success");
  } catch (err: any) {
    // 如果 Clipboard API 不可用，使用备用方法
    try {
      const textArea = document.createElement("textarea");
      textArea.value = markdown;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setMessage(t("admin.media.messages.copySuccess"), "success");
    } catch (fallbackErr: any) {
      setMessage(t("admin.media.messages.copyFailed"), "error");
    }
  }
};

// 扫描文章中的图片
const scanArticles = async () => {
  try {
    scanning.value = true;
    const result = await api.post<{
      total: number;
      existing: number;
      added: number;
      failed: number;
      skipped: number;
    }>("/api/creator/media/scan");

    if (result) {
      const message = t("admin.media.messages.scanSuccess", {
        total: result.total,
        existing: result.existing,
        added: result.added,
        failed: result.failed,
      });
      setMessage(message, "success");
      // 重新加载媒体列表
      await loadMedia();
    }
  } catch (error: any) {
    console.error("扫描失败:", error);
    setMessage(error.message || t("admin.media.messages.scanFailed"), "error");
  } finally {
    scanning.value = false;
  }
};

onMounted(() => {
  loadMedia();
});
</script>
