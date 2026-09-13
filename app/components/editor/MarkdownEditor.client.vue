<template>
  <div class="relative">
    <!-- 上传状态提示 -->
    <div
      v-if="uploading"
      class="absolute top-2 right-2 z-50 flex items-center gap-2 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-lg shadow-lg"
    >
      <ArrowPathIcon class="w-4 h-4 animate-spin" />
      <span>上传中...</span>
    </div>
    <MdEditor
      ref="editorRef"
      :editor-id="editorId"
      v-model="editorValue"
      :theme="editorTheme"
      preview-theme="github"
      :code-theme="codeTheme"
      :placeholder="placeholder"
      :style="{ height }"
      :toolbars="toolbars"
      @on-upload-img="handleUploadImg"
    >
      <template #defToolbars>
        <NormalToolbar
          :title="$t('admin.editpost.actions.selectImage') || '选择图片'"
          @onClick="handleSelectImage"
        >
          <PhotoIcon style="width: 16px; height: 16px" />
        </NormalToolbar>
        <NormalToolbar
          v-if="enableInsertAd"
          :title="$t('admin.editpost.actions.insertAdSlot')"
          @onClick="handleInsertAdSlot"
        >
          <MegaphoneIcon style="width: 16px; height: 16px" />
        </NormalToolbar>
      </template>
    </MdEditor>

    <!-- 媒体选择器 -->
    <MediaSelect
      v-model="showMediaSelect"
      :multiple="true"
      @confirm="handleImageSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { MdEditor, NormalToolbar } from "md-editor-v3";
import { useThemeStore } from "~/stores/theme";
import { ArrowPathIcon, PhotoIcon, MegaphoneIcon } from "@heroicons/vue/24/outline";
import MediaSelect from "~/components/common/MediaSelect.vue";
import { ARTICLE_ADS_PLACEHOLDER_HTML } from "~/composables/useArticleAds";
import "md-editor-v3/lib/style.css";
import "~/assets/css/fix-md-preview.css";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    height?: string;
    /** 发文编辑器显示「插入广告位」；信息页等场景关闭 */
    enableInsertAd?: boolean;
  }>(),
  {
    modelValue: "",
    placeholder: "请输入 Markdown 内容",
    height: "520px",
    enableInsertAd: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "upload-start"): void;
  (e: "upload-end"): void;
  (e: "upload-error", message: string): void;
}>();

const editorRef = ref<InstanceType<typeof MdEditor> | null>(null);
const editorId = `markdown-editor-${Math.random().toString(36).slice(2)}`;
const themeStore = useThemeStore();
const uploading = ref(false);
const showMediaSelect = ref(false);

// 工具栏配置：0 选图，1 插入广告位
const toolbars = computed(() => {
  const items: Array<string | number> = [
    "bold",
    "underline",
    "italic",
    "-",
    "title",
    "strikeThrough",
    "sub",
    "sup",
    "quote",
    "unorderedList",
    "orderedList",
    "task",
    "-",
    "codeRow",
    "code",
    "link",
    "table",
    "image",
    0,
  ];
  if (props.enableInsertAd) {
    items.push(1);
  }
  items.push(
    "-",
    "revoke",
    "next",
    "=",
    "pageFullscreen",
    "fullscreen",
    "preview",
    "catalog",
  );
  return items as any;
});

const editorTheme = computed(() => (themeStore.isDark ? "dark" : "light"));

const codeTheme = computed(() => (themeStore.isDark ? "atom" : "github"));

const editorValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit("update:modelValue", val),
});

const handleUploadImg = async (
  files: Array<File>,
  callback: (urls: string[]) => void
) => {
  if (!files.length) {
    return;
  }

  uploading.value = true;
  emit("upload-start");

  const uploaded: string[] = [];

  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response: any = await $fetch("/api/creator/media", {
        method: "POST",
        body: formData,
      });

      if (response?.c === 200 && response.d?.url) {
        // response.d 是 media 对象，包含 url 字段
        uploaded.push(response.d.url);
      } else {
        throw new Error(response?.m || "上传失败");
      }
    }

    callback(uploaded);
  } catch (err: any) {
    emit("upload-error", err?.message || "图片上传失败");
  } finally {
    uploading.value = false;
    emit("upload-end");
  }
};

const insertContent = (text: string) => {
  if (!editorRef.value) {
    return;
  }

  (editorRef.value as any).insert((_selectedText: string) => ({
    targetValue: text,
    select: false,
  }));
};

const handleInsertAdSlot = () => {
  insertContent(`\n\n${ARTICLE_ADS_PLACEHOLDER_HTML}\n\n`);
};

// 打开媒体选择器
const handleSelectImage = () => {
  showMediaSelect.value = true;
};

// 处理图片选择确认
const handleImageSelect = async (urls: string | string[]) => {
  if (!editorRef.value) {
    return;
  }

  const imageUrls = Array.isArray(urls) ? urls : [urls];
  if (imageUrls.length === 0) {
    return;
  }

  // 先关闭弹窗
  showMediaSelect.value = false;

  // 等待弹窗关闭和 DOM 更新完成
  await nextTick();

  // 再等待一小段时间确保弹窗完全关闭，焦点可以回到编辑器
  setTimeout(() => {
    if (!editorRef.value) {
      return;
    }

    // 尝试聚焦编辑器
    try {
      // 通过 editorId 找到编辑器的 textarea 元素并聚焦
      const textarea = document.querySelector(
        `#${editorId} textarea`
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        // 将光标移到末尾
        textarea.setSelectionRange(
          textarea.value.length,
          textarea.value.length
        );
      }
    } catch (error) {
      console.warn("聚焦编辑器失败:", error);
    }

    // 将选中的图片转换为 Markdown 格式并插入
    // 多张图片之间用两个换行分隔
    const markdownImages = imageUrls
      .map((url) => `![image](${url})`)
      .join("\n\n");

    // 插入内容
    // insert 方法接收一个函数，函数参数是当前选中的文本
    // 返回对象包含 targetValue（要插入的内容）和 select（是否选中插入的内容）
    (editorRef.value as any).insert((selectedText: string) => ({
      targetValue: markdownImages,
      select: false,
    }));
  }, 100);
};

defineExpose({
  insertContent,
});
</script>

<style scoped>
/* 编辑器预览里空占位可见，阅读页广告填入后不再匹配 :empty */
:deep(.article-ads:empty) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 4.5rem;
  margin: 1rem 0;
  border: 1px dashed rgb(var(--color-border));
  border-radius: 0.5rem;
  background-color: rgb(var(--color-surface-muted));
}
</style>
