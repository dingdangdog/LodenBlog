<template>
  <div class="space-y-8">
    <div v-if="message.text" class="mx-6 p-3 rounded-lg text-sm" :class="messageClass">
      {{ message.text }}
    </div>

    <section class="bg-surface text-foreground rounded-2xl border border-border p-6">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t("admin.creatorApplications.title") }}
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="filterStatus"
            class="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500">
            <option value="">
              {{ $t("admin.creatorApplications.filters.all") }}
            </option>
            <option value="PENDING">
              {{ $t("admin.creatorApplications.filters.pending") }}
            </option>
            <option value="APPROVED">
              {{ $t("admin.creatorApplications.filters.approved") }}
            </option>
            <option value="REJECTED">
              {{ $t("admin.creatorApplications.filters.rejected") }}
            </option>
          </select>
          <input v-model="filterSearch" type="text"
            :placeholder="$t('admin.creatorApplications.filters.search')"
            class="w-48 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          <button type="button"
            class="p-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium flex items-center gap-2"
            @click="loadList" :disabled="listLoading">
            <ArrowPathIcon :class="['w-4 h-4', listLoading && 'animate-spin']" />
          </button>
        </div>
      </div>

      <div v-if="listLoading" class="py-8 text-center text-sm text-muted">
        <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
        <p>{{ $t("common.loading") }}</p>
      </div>

      <div v-else-if="!list.length" class="py-8 text-center text-sm text-muted">
        {{ $t("admin.creatorApplications.noData") }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.creatorApplications.table.applicant") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.creatorApplications.table.penName") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.creatorApplications.table.key") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.creatorApplications.table.message") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.creatorApplications.table.status") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.creatorApplications.table.createdAt") }}
              </th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.creatorApplications.table.actions") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id" class="border-b border-border hover:bg-surface-muted">
              <td class="py-3 px-4 text-sm text-foreground">
                {{ item.user?.name || item.user?.username || item.user?.email || item.userId }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ item.penName }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ item.key }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground max-w-[200px]">
                <span class="line-clamp-2">{{ item.message || "-" }}</span>
              </td>
              <td class="py-3 px-4">
                <span :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  item.status === 'PENDING' && 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                  item.status === 'APPROVED' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                  item.status === 'REJECTED' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                ]">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ formatDate(item.createdAt) }}
              </td>
              <td class="py-3 px-4 text-right">
                <template v-if="item.status === 'PENDING'">
                  <button @click="approve(item)" :disabled="actionId === item.id"
                    class="px-2 py-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors mr-1">
                    {{ actionId === item.id ? "..." : $t("admin.creatorApplications.approve") }}
                  </button>
                  <button @click="openRejectDialog(item)"
                    class="px-2 py-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors mr-1">
                    {{ $t("admin.creatorApplications.reject") }}
                  </button>
                </template>
                <span v-else class="text-muted text-xs">
                  {{ item.reviewedAt ? formatDate(item.reviewedAt) : "-" }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 驳回原因弹窗 -->
    <div v-if="rejectTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="rejectTarget = null">
      <div class="bg-surface text-foreground rounded-lg shadow-xl p-6 w-full max-w-md border border-border" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">{{ $t("admin.creatorApplications.reject") }}</h3>
          <button type="button" @click="rejectTarget = null" class="text-muted hover:text-foreground">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              {{ $t("admin.creatorApplications.rejectReason") }}（{{ $t("common.optional") }}）
            </label>
            <textarea v-model="rejectReasonInput" rows="3"
              class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              :placeholder="$t('admin.creatorApplications.rejectReasonPlaceholder')" />
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" @click="rejectTarget = null"
              class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted text-sm font-medium">
              {{ $t("common.cancel") }}
            </button>
            <button type="button" @click="doReject" :disabled="rejectLoading"
              class="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 text-sm font-medium">
              {{ rejectLoading ? "..." : $t("admin.creatorApplications.reject") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "admin"],
});

import { api } from "~/utils/api";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/vue/24/outline";

const { t } = useI18n();

interface Applicant {
  id: string;
  username: string;
  name: string | null;
  email: string;
}

interface Application {
  id: string;
  userId: string;
  penName: string;
  key: string;
  message: string | null;
  status: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectReason: string | null;
  createdAt: string;
  user: Applicant | null;
}

const list = ref<Application[]>([]);
const listLoading = ref(false);
const actionId = ref<string | null>(null);
const filterStatus = ref("");
const filterSearch = ref("");
const rejectTarget = ref<Application | null>(null);
const rejectReasonInput = ref("");
const rejectLoading = ref(false);

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

function statusLabel(status: string) {
  if (status === "PENDING") return t("admin.creatorApplications.status.pending");
  if (status === "APPROVED") return t("admin.creatorApplications.status.approved");
  if (status === "REJECTED") return t("admin.creatorApplications.status.rejected");
  return status;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadList() {
  listLoading.value = true;
  try {
    const query: Record<string, string> = {};
    if (filterStatus.value) query.status = filterStatus.value;
    if (filterSearch.value.trim()) query.search = filterSearch.value.trim();
    list.value = await api.get<Application[]>("/api/admin/creator-applications", { query });
  } catch (err: any) {
    setMessage(err?.message || t("admin.creatorApplications.messages.loadFailed"), "error");
  } finally {
    listLoading.value = false;
  }
}

async function approve(item: Application) {
  actionId.value = item.id;
  try {
    await api.patch(`/api/admin/creator-applications/${item.id}`, { action: "APPROVE" });
    await loadList();
    setMessage(t("admin.creatorApplications.messages.approveSuccess"), "success");
  } catch (err: any) {
    setMessage(err?.message || t("admin.creatorApplications.messages.actionFailed"), "error");
  } finally {
    actionId.value = null;
  }
}

function openRejectDialog(item: Application) {
  rejectTarget.value = item;
  rejectReasonInput.value = "";
}

async function doReject() {
  if (!rejectTarget.value) return;
  rejectLoading.value = true;
  try {
    await api.patch(`/api/admin/creator-applications/${rejectTarget.value.id}`, {
      action: "REJECT",
      rejectReason: rejectReasonInput.value.trim() || undefined,
    });
    rejectTarget.value = null;
    await loadList();
    setMessage(t("admin.creatorApplications.messages.rejectSuccess"), "success");
  } catch (err: any) {
    setMessage(err?.message || t("admin.creatorApplications.messages.actionFailed"), "error");
  } finally {
    rejectLoading.value = false;
  }
}

watch([filterStatus, filterSearch], () => {
  loadList();
});

onMounted(() => {
  loadList();
});
</script>
