<template>
  <div class="space-y-4">
    <!-- 筛选栏 -->
    <div class="bg-surface text-foreground border border-border rounded-2xl p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="text-sm text-muted">
            {{ $t("admin.visit.filters.recordType") }}
          </label>
          <div class="w-40">
            <AppSelect v-model="visitType" :options="visitTypeOptions"
              :placeholder="$t('admin.visit.filters.recordType')" :allow-clear="false" @change="handleTypeChange" />
          </div>
        </div>
        <button type="button"
          class="p-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
          @click="loadLogs(1, false)" :disabled="listLoading">
          <span class="flex items-center gap-2">
            <ArrowPathIcon :class="['w-4 h-4', listLoading && 'animate-spin']" />
            <!-- {{ $t("common.refresh") }} -->
          </span>
        </button>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted">时间范围：</span>
        <button v-for="option in dayOptions" :key="option.value" type="button" :class="[
          'px-3 py-1 rounded-lg text-xs border transition-colors',
          selectedDays === option.value
            ? 'bg-primary-600 text-white border-primary-600'
            : 'border-border text-foreground hover:bg-surface-muted',
        ]" @click="handleDaysChange(option.value)">
          {{ option.label }}
        </button>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted">客户端：</span>
        <button v-for="option in clientOptions" :key="option.value" type="button" :class="[
          'px-3 py-1 rounded-lg text-xs border transition-colors',
          clientFilter === option.value
            ? 'bg-primary-600 text-white border-primary-600'
            : 'border-border text-foreground hover:bg-surface-muted',
        ]" @click="handleClientChange(option.value)">
          {{ option.label }}
        </button>
      </div>
      <div v-if="clientFilter === 'bot' && stats.botVendors.length" class="mt-3 flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted">Bot厂商：</span>
        <button type="button" :class="[
          'px-3 py-1 rounded-lg text-xs border transition-colors uppercase',
          selectedBotVendor === 'all'
            ? 'bg-primary-600 text-white border-primary-600'
            : 'border-border text-foreground hover:bg-surface-muted',
        ]" @click="handleBotVendorChange('all')">
          全部
        </button>
        <button v-for="vendor in stats.botVendors" :key="vendor.vendor" type="button" :class="[
          'px-3 py-1 rounded-lg text-xs border transition-colors uppercase',
          selectedBotVendor === vendor.vendor
            ? 'bg-primary-600 text-white border-primary-600'
            : 'border-border text-foreground hover:bg-surface-muted',
        ]" @click="handleBotVendorChange(vendor.vendor)">
          {{ vendor.vendor }} ({{ vendor.count }})
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-surface text-foreground border border-border rounded-xl p-4">
        <p class="text-xs text-muted">总访问</p>
        <p class="mt-1 text-2xl font-semibold">{{ stats.totalVisits }}</p>
      </div>
      <div class="bg-surface text-foreground border border-border rounded-xl p-4">
        <p class="text-xs text-muted">真实访问次数</p>
        <p class="mt-1 text-2xl font-semibold text-emerald-500">
          {{ stats.humanVisits }}
        </p>
      </div>
      <div class="bg-surface text-foreground border border-border rounded-xl p-4">
        <p class="text-xs text-muted">真实访客IP数</p>
        <p class="mt-1 text-2xl font-semibold text-sky-500">
          {{ stats.humanUniqueIps }}
        </p>
      </div>
      <div class="bg-surface text-foreground border border-border rounded-xl p-4">
        <p class="text-xs text-muted">Bot访问次数</p>
        <p class="mt-1 text-2xl font-semibold text-amber-500">
          {{ stats.botVisits }}
        </p>
      </div>
    </div>

    <div v-if="stats.botVendors.length" class="bg-surface text-foreground border border-border rounded-2xl p-4">
      <h3 class="text-sm font-semibold mb-3">Bot 厂商分布</h3>
      <div class="space-y-2">
        <div v-for="vendor in stats.botVendors.slice(0, 8)" :key="vendor.vendor" class="flex items-center gap-3">
          <div class="w-24 text-xs text-muted uppercase truncate">
            {{ vendor.vendor }}
          </div>
          <div class="flex-1 h-2 rounded bg-surface-muted overflow-hidden">
            <div class="h-full bg-amber-500" :style="{
              width: `${Math.max(
                4,
                Math.round((vendor.count / Math.max(stats.botVisits, 1)) * 100)
              )}%`,
            }" />
          </div>
          <div class="text-xs text-foreground w-10 text-right">
            {{ vendor.count }}
          </div>
        </div>
      </div>
    </div>

    <!-- 访客记录列表 -->
    <div class="bg-surface text-foreground border border-border rounded-2xl overflow-hidden">
      <div class="p-4 border-b border-border">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground">
            {{
              visitType === "admin"
                ? $t("admin.visit.title.adminVisitorRecords")
                : $t("admin.visit.title.normalVisitorRecords")
            }}
          </h2>
          <span class="px-2 py-1 rounded-lg bg-surface-muted text-xs font-medium text-muted">
            {{ pagination.total }}
          </span>
        </div>
      </div>

      <div class="max-h-[calc(100vh-200px)] overflow-y-auto">
        <!-- 加载状态 -->
        <div v-if="listLoading" class="p-8 text-center text-sm text-muted">
          <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
          <p>{{ $t("admin.visit.status.loading") }}</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!logs.length" class="p-8 text-center text-sm text-muted">
          <p>{{ $t("admin.visit.status.noRecords") }}</p>
        </div>

        <!-- 记录列表 -->
        <div v-else class="divide-y divide-border">
          <div v-for="log in logs" :key="log.id" class="p-4 hover:bg-surface-muted transition-colors cursor-pointer"
            @click="openDetailModal(log)">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm font-medium text-foreground">
                    {{ log.uri }}
                  </span>
                  <span :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase',
                    getCategoryBadgeClass(log.clientCategory),
                  ]">
                    {{ getCategoryLabel(log.clientCategory) }}
                  </span>
                  <span v-if="log.botVendor"
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {{ log.botVendor }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span v-if="log.ipAddress">
                    {{ $t("admin.visit.fields.ip") }} {{ log.ipAddress }}
                  </span>
                  <span v-if="log.userId">
                    {{ $t("admin.visit.fields.userId") }} {{ log.userId }}
                  </span>
                  <span v-if="log.userAgent" class="truncate max-w-xs">
                    {{ log.userAgent }}
                  </span>
                  <span>
                    客户端 {{ getClientTypeLabel(log.clientType) }}
                  </span>
                </div>
              </div>
              <div class="text-xs text-muted whitespace-nowrap">
                {{ formatDate(log.createdAt) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多触发器 -->
        <div v-if="hasMore && !listLoading" ref="loadMoreTrigger" class="p-4 text-center">
          <div v-if="loadingMore" class="text-sm text-muted">
            <ArrowPathIcon class="w-5 h-5 mx-auto mb-2 animate-spin" />
            <p>{{ $t("admin.visit.status.loadMore") }}</p>
          </div>
        </div>

        <!-- 没有更多数据 -->
        <div v-if="!hasMore && logs.length > 0" class="p-4 text-center text-sm text-muted">
          {{ $t("admin.visit.status.noMoreData") }}
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetailModal && selectedLog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click.self="closeDetailModal">
        <div
          class="bg-surface text-foreground rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-border"
          @click.stop>
          <!-- 头部 -->
          <div class="flex items-center justify-between p-6 border-b border-border">
            <h3 class="text-xl font-bold text-foreground">
              {{ $t("admin.visit.modal.title") }}
            </h3>
            <button type="button" @click="closeDetailModal" class="text-muted hover:text-foreground transition-colors">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <!-- 内容区域 -->
          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-4">
              <!-- 记录ID -->
              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  {{ $t("admin.visit.fields.recordId") }}
                </label>
                <div class="px-3 py-2 bg-surface-muted rounded-lg text-sm text-foreground break-all font-mono">
                  {{ selectedLog.id }}
                </div>
              </div>
              <!-- 请求URI -->
              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  {{ $t("admin.visit.fields.requestUri") }}
                </label>
                <div class="px-3 py-2 bg-surface-muted rounded-lg text-sm text-foreground break-all">
                  {{ selectedLog.uri }}
                </div>
              </div>

              <!-- IP地址 -->
              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  {{ $t("admin.visit.fields.ipAddress") }}
                </label>
                <div class="px-3 py-2 bg-surface-muted rounded-lg text-sm text-foreground">
                  {{ selectedLog.ipAddress || "-" }}
                </div>
              </div>

              <!-- 用户ID -->
              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  {{ $t("admin.visit.fields.userIdLabel") }}
                </label>
                <div class="px-3 py-2 bg-surface-muted rounded-lg text-sm text-foreground break-all">
                  {{ selectedLog.userId || "-" }}
                </div>
              </div>

              <!-- User Agent -->
              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  {{ $t("admin.visit.fields.userAgent") }}
                </label>
                <div class="px-3 py-2 bg-surface-muted rounded-lg text-sm text-foreground break-all">
                  {{ selectedLog.userAgent || "-" }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  客户端分类
                </label>
                <div class="px-3 py-2 bg-surface-muted rounded-lg text-sm text-foreground">
                  {{ getCategoryLabel(selectedLog.clientCategory) }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  Client 类型
                </label>
                <div class="px-3 py-2 bg-surface-muted rounded-lg text-sm text-foreground">
                  {{ getClientTypeLabel(selectedLog.clientType) }}
                </div>
              </div>

              <div v-if="selectedLog.botVendor">
                <label class="block text-sm font-medium text-muted mb-1">
                  Bot 厂商
                </label>
                <div class="px-3 py-2 bg-surface-muted rounded-lg text-sm text-foreground uppercase">
                  {{ selectedLog.botVendor }}
                </div>
              </div>

              <!-- 创建时间 -->
              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  {{ $t("admin.visit.fields.createdAt") }}
                </label>
                <div class="px-3 py-2 bg-surface-muted rounded-lg text-sm text-foreground">
                  {{ formatFullDate(selectedLog.createdAt) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 底部 -->
          <div class="flex justify-end p-6 border-t border-border">
            <button type="button" @click="closeDetailModal"
              class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium">
              {{ $t("admin.visit.modal.close") }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import AppSelect from "~/components/app/Select.vue";

const { t } = useI18n();

const visitTypeOptions = computed(() => [
  { value: "visit", label: t("admin.visit.filters.normalVisitor") },
  { value: "admin", label: t("admin.visit.filters.adminVisitor") },
]);

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "admin"],
});

interface VisitLog {
  id: string;
  userId: string | null;
  uri: string;
  ipAddress: string | null;
  userAgent: string | null;
  clientCategory: "human" | "bot" | "unknown";
  clientType: string;
  botVendor: string | null;
  createdAt: Date | string;
}

interface VisitStats {
  totalVisits: number;
  humanVisits: number;
  humanUniqueIps: number;
  botVisits: number;
  unknownVisits: number;
  botVendors: Array<{ vendor: string; count: number }>;
}

const logs = ref<VisitLog[]>([]);
const listLoading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const visitType = ref<"visit" | "admin">("visit");
const selectedDays = ref(7);
const clientFilter = ref<"all" | "human" | "bot" | "unknown">("all");
const selectedBotVendor = ref("all");
const stats = ref<VisitStats>({
  totalVisits: 0,
  humanVisits: 0,
  humanUniqueIps: 0,
  botVisits: 0,
  unknownVisits: 0,
  botVendors: [],
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
});

const dayOptions = [
  { value: 1, label: "今天" },
  { value: 7, label: "近7天" },
  { value: 30, label: "近30天" },
];

const clientOptions = [
  { value: "all", label: "全部" },
  { value: "human", label: "真实访问" },
  { value: "bot", label: "Bot访问" },
  { value: "unknown", label: "未知" },
] as const;

// 详情弹窗
const showDetailModal = ref(false);
const selectedLog = ref<VisitLog | null>(null);

// 无限滚动：使用 Intersection Observer
const loadMoreTrigger = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const loadLogs = async (page?: number, append: boolean = false) => {
  const targetPage = page !== undefined ? page : pagination.page;

  if (targetPage === 1 || !append) {
    listLoading.value = true;
    loadingMore.value = false;
  } else {
    if (loadingMore.value || listLoading.value) return;
    loadingMore.value = true;
  }

  try {
    const query: any = {
      page: targetPage,
      pageSize: pagination.pageSize,
      type: visitType.value,
      days: selectedDays.value,
      client: clientFilter.value,
      botVendor: selectedBotVendor.value,
    };

    const response: any = await $fetch("/api/admin/visit", { query });

    if (response?.c === 200) {
      if (append) {
        logs.value.push(...response.d.items);
      } else {
        logs.value = response.d.items;
      }
      stats.value = response.d.stats || stats.value;
      Object.assign(pagination, response.d.pagination);
      hasMore.value =
        pagination.page < Math.ceil(pagination.total / pagination.pageSize);
    }
  } catch (err: any) {
    console.error(t("admin.visit.messages.loadFailed"), err);
  } finally {
    listLoading.value = false;
    loadingMore.value = false;
    if (hasMore.value && logs.value.length > 0) {
      nextTick(() => {
        if (loadMoreTrigger.value && observer) {
          observer.disconnect();
          observer.observe(loadMoreTrigger.value);
        }
      });
    }
  }
};

// 设置无限滚动 observer
const setupInfiniteScroll = () => {
  if (observer) {
    observer.disconnect();
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries[0]?.isIntersecting &&
        hasMore.value &&
        !loadingMore.value &&
        !listLoading.value
      ) {
        loadLogs(pagination.page + 1, true);
      }
    },
    {
      rootMargin: "100px",
    }
  );

  nextTick(() => {
    if (loadMoreTrigger.value && hasMore.value && logs.value.length > 0) {
      observer?.observe(loadMoreTrigger.value);
    }
  });
};

const handleTypeChange = async () => {
  pagination.page = 1;
  logs.value = [];
  hasMore.value = true;
  selectedBotVendor.value = "all";
  await loadLogs(1, false);
  setupInfiniteScroll();
};

const handleDaysChange = async (days: number) => {
  if (selectedDays.value === days) return;
  selectedDays.value = days;
  pagination.page = 1;
  logs.value = [];
  hasMore.value = true;
  selectedBotVendor.value = "all";
  await loadLogs(1, false);
  setupInfiniteScroll();
};

const handleClientChange = async (
  client: "all" | "human" | "bot" | "unknown"
) => {
  if (clientFilter.value === client) return;
  clientFilter.value = client;
  selectedBotVendor.value = "all";
  pagination.page = 1;
  logs.value = [];
  hasMore.value = true;
  await loadLogs(1, false);
  setupInfiniteScroll();
};

const handleBotVendorChange = async (vendor: string) => {
  if (selectedBotVendor.value === vendor) return;
  selectedBotVendor.value = vendor;
  pagination.page = 1;
  logs.value = [];
  hasMore.value = true;
  await loadLogs(1, false);
  setupInfiniteScroll();
};

const getCategoryLabel = (category: "human" | "bot" | "unknown") => {
  if (category === "human") return "真实";
  if (category === "bot") return "Bot";
  return "未知";
};

const getCategoryBadgeClass = (category: "human" | "bot" | "unknown") => {
  if (category === "human") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (category === "bot") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300";
};

const getClientTypeLabel = (clientType: string) => {
  if (clientType === "browser") return "Browser";
  if (clientType === "mobile") return "Mobile";
  if (clientType === "script") return "Script";
  if (clientType === "bot") return "Bot";
  return "Unknown";
};

const formatDate = (date: string | Date | null) => {
  if (!date) return "-";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return t("admin.visit.date.justNow");
  } else if (minutes < 60) {
    return t("admin.visit.date.minutesAgo", { minutes });
  } else if (hours < 24) {
    return t("admin.visit.date.hoursAgo", { hours });
  } else if (days < 7) {
    return t("admin.visit.date.daysAgo", { days });
  } else {
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

const formatFullDate = (date: string | Date | null) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const openDetailModal = (log: VisitLog) => {
  selectedLog.value = log;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedLog.value = null;
};

onMounted(async () => {
  await loadLogs(1, false);
  setupInfiniteScroll();
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>
