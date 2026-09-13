<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="handleClose"
    >
      <div
        class="bg-surface text-foreground border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        @click.stop
      >
        <div class="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h3 class="text-lg font-semibold text-foreground">
            {{ $t("admin.posts.aiGenerationLogsModal.title") }}
          </h3>
          <button
            type="button"
            @click="handleClose"
            class="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="p-4 border-b border-border flex-shrink-0 space-y-3">
          <input
            v-model="search"
            type="text"
            class="w-full p-2 border border-border rounded-lg bg-surface text-foreground text-sm"
            :placeholder="$t('admin.posts.aiGenerationLogsModal.searchPlaceholder')"
            @keyup.enter="loadLogs(1)"
          />
          <div class="flex flex-wrap items-center gap-2">
            <AppSelect
              v-model="statusFilter"
              :options="statusOptions"
              class="min-w-[8rem]"
            />
            <button
              type="button"
              class="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 transition-colors"
              @click="loadLogs(1)"
            >
              {{ $t("admin.posts.filters.apply") }}
            </button>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-4">
          <div v-if="loading" class="py-8 text-center text-sm text-muted">
            <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p>{{ $t("common.loading") }}</p>
          </div>

          <div
            v-else-if="!logs.length"
            class="py-8 text-center text-sm text-muted"
          >
            <DocumentTextIcon class="w-10 h-10 mx-auto mb-2 text-muted" />
            <p>{{ $t("admin.posts.aiGenerationLogsModal.noLogs") }}</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="log in logs"
              :key="log.id"
              class="border border-border rounded-lg p-3 hover:bg-surface-muted/50 transition-colors"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <h4 class="font-medium text-foreground text-sm line-clamp-2 flex-1">
                  {{ log.title }}
                </h4>
                <span
                  class="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium"
                  :class="statusClass(log.status)"
                >
                  {{ statusLabel(log.status) }}
                </span>
              </div>
              <div class="text-xs text-muted space-y-1 mb-3">
                <p>
                  {{ $t("admin.posts.aiGenerationLogsModal.language") }}:
                  {{ log.languageCode }}
                </p>
                <p v-if="log.providerName">
                  {{ $t("admin.posts.aiGenerationLogsModal.provider") }}:
                  {{ log.providerName }}
                </p>
                <p>
                  {{ $t("admin.posts.aiGenerationLogsModal.createdAt") }}:
                  {{ formatDate(log.createdAt) }}
                </p>
                <p
                  v-if="log.status === 'SUCCESS' && log.contentLength"
                  class="text-green-700 dark:text-green-400"
                >
                  {{ $t("admin.posts.aiGenerationLogsModal.contentLength", { count: log.contentLength }) }}
                </p>
                <p
                  v-if="log.status === 'FAILED' && log.errorMessage"
                  class="text-red-700 dark:text-red-400 line-clamp-2"
                >
                  {{ log.errorMessage }}
                </p>
              </div>
              <p class="text-xs text-muted line-clamp-2 mb-3">
                {{ log.contentRequirement }}
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-surface-muted transition-colors"
                  @click="toggleDetail(log.id)"
                >
                  {{
                    expandedId === log.id
                      ? $t("admin.posts.aiGenerationLogsModal.hideDetail")
                      : $t("admin.posts.aiGenerationLogsModal.viewDetail")
                  }}
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg border border-primary-500 text-primary-600 dark:text-primary-400 text-xs hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  @click="emitReuse(log)"
                >
                  {{ $t("admin.posts.aiGenerationLogsModal.reuse") }}
                </button>
                <button
                  v-if="log.articleBaseId && log.status === 'SUCCESS'"
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg bg-primary-600 text-white text-xs hover:bg-primary-700 transition-colors"
                  @click="emitEdit(log.articleBaseId!)"
                >
                  {{ $t("admin.posts.aiGenerationLogsModal.editArticle") }}
                </button>
              </div>
              <div
                v-if="expandedId === log.id"
                class="mt-3 pt-3 border-t border-border text-xs space-y-2"
              >
                <p>
                  <span class="text-muted">ID:</span> {{ log.id }}
                </p>
                <p v-if="log.generatedSlug">
                  <span class="text-muted">Slug:</span> {{ log.generatedSlug }}
                </p>
                <p class="whitespace-pre-wrap break-words text-foreground">
                  {{ log.contentRequirement }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="pagination.total > pagination.pageSize"
          class="p-4 border-t border-border flex items-center justify-between flex-shrink-0"
        >
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50"
            :disabled="pagination.page <= 1 || loading"
            @click="loadLogs(pagination.page - 1)"
          >
            {{ $t("common.prev") }}
          </button>
          <span class="text-xs text-muted">
            {{ pagination.page }} / {{ pagination.totalPages || 1 }}
          </span>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50"
            :disabled="pagination.page >= (pagination.totalPages || 1) || loading"
            @click="loadLogs(pagination.page + 1)"
          >
            {{ $t("common.next") }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import {
  XMarkIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from "@heroicons/vue/24/outline";

export interface AiGenerationLogItem {
  id: string;
  userId: string;
  title: string;
  languageCode: string;
  contentRequirement: string;
  providerId: string | null;
  providerName: string | null;
  status: string;
  articleBaseId: string | null;
  articleContentId: string | null;
  generatedSlug: string | null;
  contentLength: number | null;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
  reuse: [log: AiGenerationLogItem];
  editArticle: [articleId: string];
}>();

const { t } = useI18n();

const loading = ref(false);
const logs = ref<AiGenerationLogItem[]>([]);
const search = ref("");
const statusFilter = ref("ALL");
const expandedId = ref<string | null>(null);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
});

const statusOptions = computed(() => [
  { value: "ALL", label: t("admin.posts.aiGenerationLogsModal.statusAll") },
  { value: "SUCCESS", label: t("admin.posts.aiGenerationLogsModal.statusSuccess") },
  { value: "FAILED", label: t("admin.posts.aiGenerationLogsModal.statusFailed") },
  { value: "PROCESSING", label: t("admin.posts.aiGenerationLogsModal.statusProcessing") },
]);

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    SUCCESS: t("admin.posts.aiGenerationLogsModal.statusSuccess"),
    FAILED: t("admin.posts.aiGenerationLogsModal.statusFailed"),
    PROCESSING: t("admin.posts.aiGenerationLogsModal.statusProcessing"),
  };
  return map[status] || status;
};

const statusClass = (status: string) => {
  if (status === "SUCCESS") {
    return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
  }
  if (status === "FAILED") {
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
  }
  return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

const loadLogs = async (page = 1) => {
  loading.value = true;
  try {
    const query: Record<string, string | number> = {
      page,
      pageSize: pagination.pageSize,
    };
    if (search.value.trim()) {
      query.search = search.value.trim();
    }
    if (statusFilter.value !== "ALL") {
      query.status = statusFilter.value;
    }

    const response: any = await $fetch("/api/creator/articles/ai-generation-logs", {
      query,
    });

    if (response?.c === 200) {
      logs.value = response.d.items || [];
      Object.assign(pagination, response.d.pagination);
    }
  } catch (err) {
    console.error("加载AI生成记录失败", err);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit("close");
};

const toggleDetail = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const emitReuse = (log: AiGenerationLogItem) => {
  emit("reuse", log);
  emit("close");
};

const emitEdit = (articleId: string) => {
  emit("editArticle", articleId);
  emit("close");
};

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      expandedId.value = null;
      loadLogs(1);
    }
  }
);
</script>
