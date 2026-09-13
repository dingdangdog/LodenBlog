<template>
  <div class="space-y-6">
    <!-- 消息提示 -->
    <div v-if="message.text" class="p-3 rounded-lg text-sm" :class="message.type === 'success'
      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
      ">
      {{ message.text }}
    </div>

    <!-- 数据导出区域 -->
    <div class="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
      <h3 class="text-lg font-semibold text-foreground mb-3">数据导出</h3>
      <p class="text-sm text-muted mb-4">
        导出系统数据为 JSON
        文件，用于数据备份和恢复。导出内容包括：语言、设置、分类、标签、文章、主题、翻译配置等。
      </p>

      <div class="flex">
        <button type="button" @click="handleExport" :disabled="exporting"
          class="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
          <ArrowPathIcon v-if="exporting" class="w-4 h-4 animate-spin" />
          <ArrowUpTrayIcon v-else class="w-4 h-4" />
          {{ exporting ? "导出中..." : "导出数据" }}
        </button>
      </div>
    </div>

    <!-- 数据导入区域 -->
    <div class="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
      <h3 class="text-lg font-semibold text-foreground mb-3">数据导入</h3>
      <p class="text-sm text-muted mb-4">
        导入 JSON 数据文件，恢复系统数据。支持完整的数据恢复，包括所有关联关系。
      </p>

      <div class="space-y-4">
        <!-- 文件选择 -->
        <div>
          <label class="block text-sm font-medium text-muted mb-2">
            选择 JSON 文件
            <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-3">
            <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileSelect" />
            <button type="button" @click="() => fileInput?.click()"
              class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium flex items-center gap-2">
              <ArrowDownTrayIcon class="w-4 h-4" />
              选择文件
            </button>
            <span v-if="selectedFileName" class="text-sm text-muted">
              {{ selectedFileName }}
            </span>

            <button type="button" @click="handleImport" :disabled="!selectedFile || importing"
              class="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
              <ArrowPathIcon v-if="importing" class="w-4 h-4 animate-spin" />
              <ArrowDownTrayIcon v-else class="w-4 h-4" />
              {{ importing ? "导入中..." : "开始导入" }}
            </button>
          </div>
        </div>

        <!-- 导入结果 -->
        <div v-if="importResult" class="p-4 rounded-lg text-sm" :class="importResult.type === 'success'
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          ">
          <p class="font-medium mb-2">{{ importResult.message }}</p>
          <div v-if="importResult.stats" class="mt-2 space-y-1 text-xs">
            <p v-for="row in statsRows" :key="row.key" class="flex flex-wrap gap-x-2">
              <span class="font-medium">{{ row.label }}:</span>
              <span>创建 {{ row.created }}</span>
              <span>, 跳过 {{ row.skipped }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- VanBlog 数据导入 -->
    <div class="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
      <h3 class="text-lg font-semibold text-foreground mb-3">VanBlog 数据导入</h3>
      <p class="text-sm text-muted mb-4">
        从 VanBlog 导出的 JSON 文件导入文章、分类、标签。文章 ID 将作为本系统文章 slug，分类与标签的名称即为其 slug。
      </p>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-muted mb-2">
            选择 VanBlog 导出的 JSON 文件
            <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-3 flex-wrap">
            <input ref="vanblogFileInput" type="file" accept=".json" class="hidden" @change="handleVanblogFileSelect" />
            <button type="button" @click="() => vanblogFileInput?.click()"
              class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium flex items-center gap-2">
              <ArrowDownTrayIcon class="w-4 h-4" />
              选择文件
            </button>
            <span v-if="vanblogFileName" class="text-sm text-muted">
              {{ vanblogFileName }}
            </span>
            <button type="button" @click="handleVanblogImport" :disabled="!vanblogSelectedFile || vanblogImporting"
              class="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
              <ArrowPathIcon v-if="vanblogImporting" class="w-4 h-4 animate-spin" />
              <ArrowDownTrayIcon v-else class="w-4 h-4" />
              {{ vanblogImporting ? "导入中..." : "导入 VanBlog 数据" }}
            </button>
          </div>
        </div>

        <div v-if="vanblogImportResult" class="p-4 rounded-lg text-sm" :class="vanblogImportResult.type === 'success'
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          ">
          <p class="font-medium mb-2">{{ vanblogImportResult.message }}</p>
          <div v-if="vanblogImportResult.stats" class="mt-2 space-y-1 text-xs">
            <p v-for="row in vanblogStatsRows" :key="row.key" class="flex flex-wrap gap-x-2">
              <span class="font-medium">{{ row.label }}:</span>
              <span>创建 {{ row.created }}</span>
              <span>, 跳过 {{ row.skipped }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/vue/24/outline";

const { t } = useI18n();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File>();
const selectedFileName = ref<string>("");
const importing = ref(false);
const exporting = ref(false);

const vanblogFileInput = ref<HTMLInputElement | null>(null);
const vanblogSelectedFile = ref<File>();
const vanblogFileName = ref<string>("");
const vanblogImporting = ref(false);
const vanblogImportResult = ref<{
  type: "success" | "error";
  message: string;
  stats?: Record<string, { created: number; skipped: number }>;
} | null>(null);

const importResult = ref<{
  type: "success" | "error";
  message: string;
  stats?: any;
} | null>(null);

const tableLabels: Record<string, string> = {
  users: "用户",
  languages: "语言",
  settings: "系统设置",
  systemConfigs: "系统配置",
  categories: "分类",
  tags: "标签",
  themes: "主题",
  translationConfigs: "翻译配置",
  aiConfigs: "AI配置",
  creators: "创作者",
  articleBases: "文章基础",
  articleContents: "文章内容",
  comments: "评论",
  media: "媒体",
  articleLikes: "点赞",
  translationLogs: "翻译日志",
  loginLogs: "登录日志",
  visitLogs: "访问日志",
  adminVisitLogs: "后台访问日志",
  friendLinks: "友链",
};

const statsRows = computed(() => {
  const stats = importResult.value?.stats;
  if (!stats || typeof stats !== "object") return [];
  const entries = Object.entries(stats) as Array<[string, any]>;
  return entries
    .map(([key, v]) => ({
      key,
      label: tableLabels[key] || key,
      created: Number(v?.created ?? 0),
      skipped: Number(v?.skipped ?? 0),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN"));
});

const vanblogStatsRows = computed(() => {
  const stats = vanblogImportResult.value?.stats;
  if (!stats || typeof stats !== "object") return [];
  const entries = Object.entries(stats) as Array<[string, { created?: number; skipped?: number }]>;
  return entries
    .map(([key, v]) => ({
      key,
      label: tableLabels[key] || key,
      created: Number(v?.created ?? 0),
      skipped: Number(v?.skipped ?? 0),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN"));
});

const message = ref<{ text: string; type: "success" | "error" | "" }>({
  text: "",
  type: "",
});

const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: "", type: "" };
  }, 5000);
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
    selectedFileName.value = target.files[0]?.name || "";
    importResult.value = null;
  }
};

// 处理导出
const handleExport = async () => {
  exporting.value = true;
  setMessage("", "");

  try {
    const response: any = await $fetch("/api/admin/system/export", {
      method: "POST",
    });

    if (response?.c === 200 && response.d) {
      // 创建下载链接
      const dataStr = JSON.stringify(response.d, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `loden-backup-${new Date().toISOString().split("T")[0]
        }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage(
        `导出成功！共导出 ${JSON.stringify(response.d.stats)} 条数据`,
        "success"
      );
    } else {
      setMessage(response?.m || "导出失败");
    }
  } catch (err: any) {
    console.error("导出失败:", err);
    setMessage(err?.data?.m || err?.message || "导出失败");
  } finally {
    exporting.value = false;
  }
};

// 处理导入
const handleImport = async () => {
  if (!selectedFile.value) {
    setMessage("请选择文件");
    return;
  }

  importing.value = true;
  importResult.value = null;
  setMessage("", "");

  try {
    // 读取文件内容
    const fileContent = await selectedFile.value.text();
    let jsonData;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (err: any) {
      importResult.value = {
        type: "error",
        message: "JSON 格式错误: " + err.message,
      };
      setMessage("JSON 格式错误: " + err.message);
      importing.value = false;
      return;
    }

    // 验证数据格式
    if (!jsonData.data || typeof jsonData.data !== "object") {
      importResult.value = {
        type: "error",
        message: "数据格式错误：缺少 data 字段",
      };
      setMessage("数据格式错误：缺少 data 字段");
      importing.value = false;
      return;
    }

    // 调用导入接口
    const response: any = await $fetch("/api/admin/system/import", {
      method: "POST",
      body: {
        jsonData,
      },
    });

    if (response?.c === 200) {
      importResult.value = {
        type: "success",
        message: response.m || "导入成功",
        stats: response.d?.stats,
      };
      setMessage(response.m || "导入成功", "success");
    } else {
      importResult.value = {
        type: "error",
        message: response?.m || "导入失败",
      };
      setMessage(response?.m || "导入失败");
    }
  } catch (err: any) {
    console.error("导入失败:", err);
    importResult.value = {
      type: "error",
      message: err?.data?.m || err?.message || "导入失败",
    };
    setMessage(err?.data?.m || err?.message || "导入失败");
  } finally {
    importing.value = false;
  }
};

const handleVanblogFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    vanblogSelectedFile.value = target.files[0];
    vanblogFileName.value = target.files[0]?.name || "";
    vanblogImportResult.value = null;
  }
};

const handleVanblogImport = async () => {
  if (!vanblogSelectedFile.value) {
    setMessage("请选择 VanBlog 导出的 JSON 文件");
    return;
  }
  vanblogImporting.value = true;
  vanblogImportResult.value = null;
  setMessage("", "");
  try {
    const fileContent = await vanblogSelectedFile.value.text();
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (err: any) {
      vanblogImportResult.value = { type: "error", message: "JSON 格式错误: " + err.message };
      setMessage("JSON 格式错误: " + err.message);
      vanblogImporting.value = false;
      return;
    }
    const response: any = await $fetch("/api/admin/system/import-vanblog", {
      method: "POST",
      body: { jsonData },
    });
    if (response?.c === 200) {
      vanblogImportResult.value = {
        type: "success",
        message: response.m || "VanBlog 导入成功",
        stats: response.d?.stats,
      };
      setMessage(response.m || "VanBlog 导入成功", "success");
    } else {
      vanblogImportResult.value = { type: "error", message: response?.m || "VanBlog 导入失败" };
      setMessage(response?.m || "VanBlog 导入失败");
    }
  } catch (err: any) {
    console.error("VanBlog 导入失败:", err);
    vanblogImportResult.value = {
      type: "error",
      message: err?.data?.m || err?.message || "VanBlog 导入失败",
    };
    setMessage(err?.data?.m || err?.message || "VanBlog 导入失败");
  } finally {
    vanblogImporting.value = false;
  }
};
</script>
