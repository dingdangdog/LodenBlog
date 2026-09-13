<template>
  <div class="space-y-8">
    <div v-if="message.text" class="mx-6 p-3 rounded-lg text-sm" :class="messageClass">
      {{ message.text }}
    </div>

    <section class="bg-surface text-foreground rounded-2xl border border-border p-6">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t("admin.comment.title") || "评论管理" }}
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="filterApproved"
            class="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500">
            <option value="">
              {{ $t("admin.comment.filters.all") || "全部" }}
            </option>
            <option value="false">
              {{ $t("admin.comment.filters.pending") || "待审核" }}
            </option>
            <option value="true">
              {{ $t("admin.comment.filters.approved") || "已通过" }}
            </option>
          </select>
          <input v-model="filterSearch" type="text" :placeholder="$t('admin.comment.filters.search') || '搜索内容/作者...'"
            class="w-48 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          <button type="button"
            class="p-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium flex items-center gap-2"
            @click="loadComments" :disabled="listLoading">
            <ArrowPathIcon :class="['w-4 h-4', listLoading && 'animate-spin']" />
            <!-- {{ $t("common.refresh") }} -->
          </button>
        </div>
      </div>

      <div v-if="listLoading" class="py-8 text-center text-sm text-muted">
        <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
        <p>{{ $t("common.loading") }}</p>
      </div>

      <div v-else-if="!comments.length" class="py-8 text-center text-sm text-muted">
        {{ $t("admin.comment.noData") || "暂无评论" }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.comment.table.content") || "内容" }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.comment.table.author") || "作者" }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.comment.table.article") || "文章" }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.comment.table.status") || "状态" }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.comment.table.createdAt") || "时间" }}
              </th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-muted">
                {{ $t("admin.comment.table.actions") || "操作" }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in comments" :key="item.id" class="border-b border-border hover:bg-surface-muted">
              <td class="py-3 px-4 text-sm text-foreground max-w-[240px]">
                <span class="line-clamp-2">{{ item.content }}</span>
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ authorDisplay(item) }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground max-w-[160px]">
                <span class="line-clamp-1" :title="item.articleTitle || ''">
                  {{ item.articleTitle || "-" }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  item.isApproved
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                ]">
                  {{
                    item.isApproved
                      ? ($t("admin.comment.status.approved") || "已通过")
                      : ($t("admin.comment.status.pending") || "待审核")
                  }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ formatDate(item.createdAt) }}
              </td>
              <td class="py-3 px-4 text-right">
                <template v-if="!item.isApproved">
                  <button @click="setApproved(item, true)" :disabled="actionId === item.id"
                    class="px-2 py-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors mr-1">
                    {{ actionId === item.id ? "..." : ($t("admin.comment.approve") || "通过") }}
                  </button>
                </template>
                <template v-else>
                  <button @click="setApproved(item, false)" :disabled="actionId === item.id"
                    class="px-2 py-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors mr-1">
                    {{ actionId === item.id ? "..." : ($t("admin.comment.reject") || "驳回") }}
                  </button>
                </template>
                <button @click="deleteComment(item)"
                  class="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                  {{ $t("admin.comment.delete") || "删除" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "admin"],
});

import { api } from "~/utils/api";
import { useConfirm } from "~/composables/useConfirm";
import { ArrowPathIcon } from "@heroicons/vue/24/outline";

const { t } = useI18n();
const { showConfirm } = useConfirm();

interface CommentUser {
  id: string;
  username: string;
  name: string | null;
}

interface Comment {
  id: string;
  content: string;
  authorName: string | null;
  authorEmail: string | null;
  authorUrl: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  articleBaseId: string;
  articleTitle: string | null;
  userId: string | null;
  parentId: string | null;
  user: CommentUser | null;
}

const comments = ref<Comment[]>([]);
const listLoading = ref(false);
const actionId = ref<string | null>(null);
const filterApproved = ref("");
const filterSearch = ref("");

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

function authorDisplay(item: Comment): string {
  if (item.user) {
    return item.user.name || item.user.username || "-";
  }
  return item.authorName || item.authorEmail || "-";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadComments() {
  listLoading.value = true;
  try {
    const query: Record<string, string> = {};
    if (filterApproved.value !== "") query.isApproved = filterApproved.value;
    if (filterSearch.value.trim()) query.search = filterSearch.value.trim();
    comments.value = await api.get<Comment[]>("/api/admin/comment", {
      query,
    });
  } catch (err: any) {
    console.error("加载评论列表失败:", err);
    setMessage(
      err?.message || (t("admin.comment.messages.loadFailed") || "加载评论列表失败"),
      "error"
    );
  } finally {
    listLoading.value = false;
  }
}

async function setApproved(item: Comment, approved: boolean) {
  actionId.value = item.id;
  try {
    await api.patch(`/api/admin/comment/${item.id}`, { isApproved: approved });
    await loadComments();
    setMessage(
      approved
        ? (t("admin.comment.messages.approveSuccess") || "已通过")
        : (t("admin.comment.messages.rejectSuccess") || "已驳回"),
      "success"
    );
  } catch (err: any) {
    setMessage(err?.message || (t("admin.comment.messages.updateFailed") || "操作失败"), "error");
  } finally {
    actionId.value = null;
  }
}

async function deleteComment(item: Comment) {
  const confirmed = await showConfirm({
    title: t("admin.comment.delete") || "删除",
    message: t("admin.comment.messages.deleteConfirm") || "确定要删除这条评论吗？",
    type: "danger",
    confirmText: t("common.delete") || "删除",
    cancelText: t("common.cancel") || "取消",
  });
  if (!confirmed) return;
  try {
    await api.delete(`/api/admin/comment/${item.id}`);
    await loadComments();
    setMessage(t("admin.comment.messages.deleteSuccess") || "删除成功", "success");
  } catch (err: any) {
    setMessage(err?.message || (t("admin.comment.messages.deleteFailed") || "删除失败"), "error");
  }
}

watch(filterApproved, () => {
  loadComments();
});

onMounted(() => {
  loadComments();
});
</script>
