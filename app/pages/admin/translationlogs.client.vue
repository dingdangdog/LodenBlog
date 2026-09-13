<template>
  <div class="space-y-6">
    <!-- 消息提示 -->
    <div v-if="message.text" class="mx-6 p-3 rounded-lg text-sm" :class="messageClass">
      {{ message.text }}
    </div>

    <!-- 筛选栏 -->
    <div class="bg-surface text-foreground border border-border rounded-2xl p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="w-40">
          <AppSelect v-model="filters.taskType" :options="taskTypeOptions"
            :placeholder="$t('admin.translationlogs.filters.allTypes')" />
        </div>
        <div class="w-40">
          <AppSelect v-model="filters.status" :options="statusOptions"
            :placeholder="$t('admin.translationlogs.filters.allStatus')" />
        </div>
        <div class="w-40">
          <AppSelect v-model="filters.sourceLanguageCode" :options="languageOptions" :placeholder="$t('admin.translationlogs.filters.allSourceLanguages')
            " />
        </div>
        <div class="w-40">
          <AppSelect v-model="filters.targetLanguageCode" :options="languageOptions" :placeholder="$t('admin.translationlogs.filters.allTargetLanguages')
            " />
        </div>
        <button type="button"
          class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
          @click="loadLogs">
          {{ $t("admin.translationlogs.filters.apply") }}
        </button>
        <button type="button"
          class="p-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
          @click="loadLogs" :disabled="listLoading">
          <span class="flex items-center gap-2">
            <ArrowPathIcon :class="['w-4 h-4', listLoading && 'animate-spin']" />
            <!-- {{ $t("common.refresh") }} -->
          </span>
        </button>
        <button type="button"
          class="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleRetryAllFailed" :disabled="retryAllLoading">
          <span class="flex items-center gap-2">
            <ArrowPathIcon :class="['w-4 h-4', retryAllLoading && 'animate-spin']" />
            {{ $t("admin.translationlogs.actions.retryAllFailed") }}
          </span>
        </button>
      </div>
    </div>

    <!-- 翻译日志列表 -->
    <div class="bg-surface text-foreground border border-border rounded-2xl overflow-hidden">
      <div class="p-4 border-b border-border">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground">
            {{ $t("admin.translationlogs.title") }}
          </h2>
          <span class="px-2 py-1 rounded-lg bg-surface-muted text-xs font-medium text-muted">
            {{ pagination.total }}
          </span>
        </div>
      </div>

      <div class="max-h-[calc(100vh-300px)] overflow-y-auto">
        <!-- 加载状态 -->
        <div v-if="listLoading" class="p-8 text-center text-sm text-muted">
          <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
          <p>{{ $t("admin.translationlogs.actions.loading") }}</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!logs.length" class="p-8 text-center text-sm text-muted">
          <DocumentTextIcon class="w-12 h-12 mx-auto mb-3 text-muted" />
          <p class="font-medium mb-1">
            {{ $t("admin.translationlogs.actions.noLogs") }}
          </p>
        </div>

        <!-- 日志列表 -->
        <div v-else class="divide-y divide-border">
          <div v-for="log in logs" :key="log.id" class="p-4 hover:bg-surface-muted transition-colors">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-2">
                  <span class="px-2 py-0.5 rounded text-xs font-medium" :class="getTaskTypeClass(log.taskType)">
                    {{ getTaskTypeText(log.taskType) }}
                  </span>
                  <span class="px-2 py-0.5 rounded text-xs font-medium" :class="getStatusClass(log.status)">
                    {{ getStatusText(log.status) }}
                  </span>
                  <span v-if="log.provider"
                    class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {{ log.provider.name }} ({{ log.provider.provider }})
                  </span>
                </div>

                <div class="space-y-1 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-muted">{{
                      $t("admin.translationlogs.fields.articleId")
                    }}</span>
                    <span class="text-foreground font-mono text-xs">
                      {{ log.articleBaseId }}
                    </span>
                    <button @click.stop="copyArticleId(log.articleBaseId)"
                      class="p-1 rounded text-muted hover:text-primary-600 hover:bg-surface-muted transition-colors"
                      :title="$t('admin.translationlogs.actions.copyArticleId')">
                      <ClipboardDocumentIcon class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-muted">{{
                      $t("admin.translationlogs.fields.translationDirection")
                    }}</span>
                    <span class="text-foreground">
                      {{ getLanguageName(log.sourceLanguageCode) }} →
                      {{ getLanguageName(log.targetLanguageCode) }}
                    </span>
                  </div>
                  <div v-if="log.errorMessage" class="flex items-start gap-2">
                    <span class="text-muted">{{
                      $t("admin.translationlogs.fields.errorMessage")
                    }}</span>
                    <span class="text-red-600 dark:text-red-400 text-xs flex-1">
                      {{ log.errorMessage }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-xs text-muted">
                    <span>{{ $t("admin.translationlogs.fields.created") }}
                      {{ formatDate(log.createdAt) }}</span>
                    <span v-if="log.startedAt">{{ $t("admin.translationlogs.fields.started") }}
                      {{ formatDate(log.startedAt) }}</span>
                    <span v-if="log.completedAt">{{ $t("admin.translationlogs.fields.completed") }}
                      {{ formatDate(log.completedAt) }}</span>
                    <span v-if="log.retryCount > 0">{{ $t("admin.translationlogs.fields.retryCount") }}
                      {{ log.retryCount }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <button v-if="log.taskType === 'TASK' && canRetry(log.status)" @click="handleRetry(log)"
                  :disabled="retryingTasks.has(log.id)"
                  class="p-2 rounded text-muted hover:text-blue-600 hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="$t('admin.translationlogs.actions.retryTitle')">
                  <ArrowPathIcon v-if="!retryingTasks.has(log.id)" class="w-5 h-5" />
                  <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
                </button>
                <button @click="handleDelete(log)" :disabled="deletingTasks.has(log.id)"
                  class="p-2 rounded text-muted hover:text-red-600 hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="$t('admin.translationlogs.actions.deleteTitle')">
                  <TrashIcon v-if="!deletingTasks.has(log.id)" class="w-5 h-5" />
                  <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="p-4 border-t border-border flex items-center justify-between">
        <div class="text-sm text-muted">
          {{
            $t("admin.translationlogs.pagination.total", {
              total: pagination.total,
              page: pagination.page,
              totalPages: pagination.totalPages,
            })
          }}
        </div>
        <div class="flex items-center gap-2">
          <button type="button" @click="goToPage(pagination.page - 1)" :disabled="pagination.page <= 1"
            class="px-3 py-1 rounded-lg border border-border text-foreground hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
            {{ $t("admin.translationlogs.pagination.previous") }}
          </button>
          <button type="button" @click="goToPage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages"
            class="px-3 py-1 rounded-lg border border-border text-foreground hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
            {{ $t("admin.translationlogs.pagination.next") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import {
  ArrowPathIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import { useConfirm } from "~/composables/useConfirm";

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "creator"],
});

interface LanguageItem {
  id: string;
  code: string;
  name: string;
  nativeName?: string;
}

interface TranslationLogItem {
  id: string;
  articleBaseId: string;
  userId: string;
  sourceContentId: string;
  sourceLanguageCode: string;
  targetLanguageCode: string;
  providerId: string | null;
  taskType: string;
  status: string;
  errorMessage: string | null;
  errorDetails: string | null;
  retryCount: number;
  resolvedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  articleBase: {
    id: string;
    status: string;
    isPublished: boolean;
  } | null;
  provider: {
    id: string;
    name: string;
    provider: string;
  } | null;
}

const languages = ref<LanguageItem[]>([]);
const logs = ref<TranslationLogItem[]>([]);
const listLoading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
});

const filters = reactive({
  taskType: "",
  status: "",
  sourceLanguageCode: "",
  targetLanguageCode: "",
});

// 消息提示
const message = reactive({
  text: "",
  type: "success" as "success" | "error",
});

const messageClass = computed(() =>
  message.type === "success"
    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
);

const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.text = text;
  message.type = type;
  setTimeout(() => {
    message.text = "";
  }, 4000);
};

const { t } = useI18n();
const { showConfirm } = useConfirm();

// 任务类型选项
const taskTypeOptions = computed(() => [
  { value: "TASK", label: t("admin.translationlogs.taskTypes.TASK") },
  {
    value: "FAILURE_LOG",
    label: t("admin.translationlogs.taskTypes.FAILURE_LOG"),
  },
]);

// 状态选项
const statusOptions = computed(() => [
  { value: "PENDING", label: t("admin.translationlogs.status.PENDING") },
  { value: "PROCESSING", label: t("admin.translationlogs.status.PROCESSING") },
  { value: "COMPLETED", label: t("admin.translationlogs.status.COMPLETED") },
  { value: "FAILED", label: t("admin.translationlogs.status.FAILED") },
  {
    value: "PENDING_RETRY",
    label: t("admin.translationlogs.status.PENDING_RETRY"),
  },
  { value: "RESOLVED", label: t("admin.translationlogs.status.RESOLVED") },
  { value: "IGNORED", label: t("admin.translationlogs.status.IGNORED") },
]);

// 语言选项
const languageOptions = computed(() => {
  return languages.value.map((lang) => ({
    value: lang.code,
    label: `${lang.nativeName || lang.name} (${lang.code})`,
  }));
});

// 重新执行任务相关状态
const retryingTasks = ref<Set<string>>(new Set());

// 删除任务相关状态
const deletingTasks = ref<Set<string>>(new Set());

// 一键重新处理所有失败任务相关状态
const retryAllLoading = ref(false);

// 获取语言名称
const getLanguageName = (code: string) => {
  const lang = languages.value.find((l) => l.code === code);
  return lang ? `${lang.nativeName || lang.name} (${lang.code})` : code;
};

// 获取任务类型样式
const getTaskTypeClass = (taskType: string) => {
  if (taskType === "TASK") {
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
  }
  return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
};

// 获取任务类型文本
const getTaskTypeText = (taskType: string) => {
  return taskType === "TASK"
    ? t("admin.translationlogs.taskTypes.TASK")
    : t("admin.translationlogs.taskTypes.FAILURE_LOG");
};

// 获取状态样式
const getStatusClass = (status: string) => {
  const statusMap: Record<string, string> = {
    PENDING:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    PROCESSING:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    COMPLETED:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    FAILED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    PENDING_RETRY:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    RESOLVED: "bg-surface-muted text-muted",
    IGNORED: "bg-surface-muted text-muted",
  };
  return (
    statusMap[status] ||
    "bg-surface-muted text-muted"
  );
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    PENDING: t("admin.translationlogs.status.PENDING"),
    PROCESSING: t("admin.translationlogs.status.PROCESSING"),
    COMPLETED: t("admin.translationlogs.status.COMPLETED"),
    FAILED: t("admin.translationlogs.status.FAILED"),
    PENDING_RETRY: t("admin.translationlogs.status.PENDING_RETRY"),
    RESOLVED: t("admin.translationlogs.status.RESOLVED"),
    IGNORED: t("admin.translationlogs.status.IGNORED"),
  };
  return statusMap[status] || status;
};

// 判断是否可以重试
const canRetry = (status: string) => {
  return ["FAILED", "COMPLETED"].includes(status);
};

// 格式化日期
const formatDate = (date: string | null) => {
  if (!date) return "-";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return t("admin.translationlogs.date.justNow");
  } else if (minutes < 60) {
    return t("admin.translationlogs.date.minutesAgo", { minutes });
  } else if (hours < 24) {
    return t("admin.translationlogs.date.hoursAgo", { hours });
  } else if (days < 7) {
    return t("admin.translationlogs.date.daysAgo", { days });
  } else {
    return d.toLocaleString();
  }
};

// 加载语言列表
const loadLanguages = async () => {
  try {
    const response: any = await $fetch("/api/languages");
    if (response?.c === 200) {
      languages.value = Array.isArray(response.d) ? response.d : (response.d?.items || []);
    }
  } catch (error) {
    console.error("加载语言失败", error);
  }
};

// 加载翻译日志
const loadLogs = async () => {
  listLoading.value = true;
  try {
    const query: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    };

    if (filters.taskType) {
      query.taskType = filters.taskType;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.sourceLanguageCode) {
      query.sourceLanguageCode = filters.sourceLanguageCode;
    }
    if (filters.targetLanguageCode) {
      query.targetLanguageCode = filters.targetLanguageCode;
    }

    const response: any = await $fetch("/api/creator/translationlog", {
      query,
    });

    if (response?.c === 200) {
      logs.value = response.d.items || [];
      Object.assign(pagination, response.d.pagination);
    } else {
      setMessage(
        response?.m || t("admin.translationlogs.messages.loadFailed"),
        "error"
      );
    }
  } catch (err: any) {
    console.error("加载翻译日志失败", err);
    setMessage(
      err?.message || t("admin.translationlogs.messages.loadFailed"),
      "error"
    );
  } finally {
    listLoading.value = false;
  }
};

// 跳转页面
const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.page = page;
    loadLogs();
  }
};

// 复制文章ID
const copyArticleId = async (articleId: string) => {
  try {
    await navigator.clipboard.writeText(articleId);
    setMessage(t("admin.translationlogs.messages.copySuccess"), "success");
  } catch (err: any) {
    // 如果 Clipboard API 不可用，使用备用方法
    try {
      const textArea = document.createElement("textarea");
      textArea.value = articleId;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setMessage(t("admin.translationlogs.messages.copySuccess"), "success");
    } catch (fallbackErr: any) {
      setMessage(t("admin.translationlogs.messages.copyFailed"), "error");
    }
  }
};

// 处理重新执行
const handleRetry = async (log: TranslationLogItem) => {
  if (!canRetry(log.status)) {
    return;
  }

  retryingTasks.value.add(log.id);

  try {
    const response: any = await $fetch(
      `/api/creator/translationlog/${log.id}/retry`,
      {
        method: "POST",
      }
    );

    if (response?.c === 200) {
      setMessage(t("admin.translationlogs.messages.retrySuccess"), "success");
      // 刷新列表
      await loadLogs();
    } else {
      setMessage(
        response?.m || t("admin.translationlogs.messages.retryFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.translationlogs.messages.retryFailed"),
      "error"
    );
  } finally {
    retryingTasks.value.delete(log.id);
  }
};

// 处理删除
const handleDelete = async (log: TranslationLogItem) => {
  const confirmed = await showConfirm({
    title: t("admin.translationlogs.actions.deleteTitle"),
    message: t("admin.translationlogs.messages.deleteConfirm", {
      articleId: log.articleBaseId,
    }),
    type: "danger",
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
  });

  if (!confirmed) {
    return;
  }

  deletingTasks.value.add(log.id);

  try {
    const response: any = await $fetch(
      `/api/creator/translationlog/${log.id}`,
      {
        method: "DELETE",
      }
    );

    if (response?.c === 200) {
      setMessage(t("admin.translationlogs.messages.deleteSuccess"), "success");
      // 刷新列表
      await loadLogs();
    } else {
      setMessage(
        response?.m || t("admin.translationlogs.messages.deleteFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.translationlogs.messages.deleteFailed"),
      "error"
    );
  } finally {
    deletingTasks.value.delete(log.id);
  }
};

// 处理一键重新处理所有失败任务
const handleRetryAllFailed = async () => {
  const confirmed = await showConfirm({
    title: t("admin.translationlogs.actions.retryAllFailed"),
    message: t("admin.translationlogs.messages.retryAllFailedConfirm"),
    type: "warning",
    confirmText: t("common.confirm"),
    cancelText: t("common.cancel"),
  });

  if (!confirmed) {
    return;
  }

  retryAllLoading.value = true;

  try {
    const response: any = await $fetch(
      "/api/creator/translationlog/retry-all-failed",
      {
        method: "POST",
      }
    );

    if (response?.c === 200) {
      setMessage(
        response?.m || t("admin.translationlogs.messages.retryAllFailedSuccess"),
        "success"
      );
      // 刷新列表
      await loadLogs();
    } else {
      setMessage(
        response?.m || t("admin.translationlogs.messages.retryAllFailedFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.translationlogs.messages.retryAllFailedFailed"),
      "error"
    );
  } finally {
    retryAllLoading.value = false;
  }
};

// 初始化
onMounted(async () => {
  await Promise.all([loadLanguages(), loadLogs()]);
});
</script>
