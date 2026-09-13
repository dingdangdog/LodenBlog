<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="handleClose"
    >
      <div
        class="bg-surface text-foreground border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        @click.stop
      >
        <!-- 头部 -->
        <div class="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div class="min-w-0">
            <h3 class="text-lg font-semibold text-foreground truncate">
              {{ $t("admin.posts.commentsModal.title") }}
            </h3>
            <p v-if="articleTitle" class="text-sm text-muted truncate mt-0.5">
              {{ articleTitle }}
            </p>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="flex-shrink-0 p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- 评论列表区域 -->
        <div class="flex-1 min-h-0 overflow-y-auto p-4">
          <div v-if="loading" class="py-8 text-center text-sm text-muted">
            <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p>{{ $t("common.loading") }}</p>
          </div>

          <div
            v-else-if="!comments.length"
            class="py-8 text-center text-sm text-muted"
          >
            <ChatBubbleLeftIcon class="w-10 h-10 mx-auto mb-2 text-muted" />
            <p>{{ $t("admin.posts.commentsModal.noComments") }}</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in commentTree"
              :key="item.id"
              :class="[item.parentId ? 'pl-6 border-l-2 border-border' : '']"
            >
              <div class="bg-surface-muted/50 rounded-lg p-3">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <span class="font-medium text-foreground text-sm">
                    {{ authorDisplay(item) }}
                  </span>
                  <span class="text-xs text-muted flex-shrink-0">
                    {{ formatDate(item.createdAt) }}
                  </span>
                </div>
                <p class="text-sm text-foreground whitespace-pre-wrap break-words mb-2">
                  {{ item.content }}
                </p>
                <div v-if="!item.isApproved" class="mb-2">
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                  >
                    {{ $t("admin.comment.status.pending") }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    @click="startReply(item)"
                    class="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {{ $t("common.reply") }}
                  </button>
                  <template v-if="!item.isApproved">
                    <button
                      type="button"
                      @click="setApproved(item, true)"
                      :disabled="actionId === item.id"
                      class="text-xs text-green-600 dark:text-green-400 hover:underline disabled:opacity-50"
                    >
                      {{ actionId === item.id ? "..." : $t("admin.comment.approve") }}
                    </button>
                  </template>
                  <template v-else>
                    <button
                      type="button"
                      @click="setApproved(item, false)"
                      :disabled="actionId === item.id"
                      class="text-xs text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
                    >
                      {{ actionId === item.id ? "..." : $t("admin.comment.reject") }}
                    </button>
                  </template>
                  <button
                    type="button"
                    @click="confirmDelete(item)"
                    :disabled="actionId === item.id"
                    class="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                  >
                    {{ $t("admin.comment.delete") }}
                  </button>
                </div>
              </div>

              <!-- 回复表单（当前项） -->
              <div
                v-if="replyTarget?.id === item.id"
                class="mt-2 pl-2"
              >
                <textarea
                  ref="replyTextareaRef"
                  v-model="replyContent"
                  :placeholder="$t('admin.posts.commentsModal.replyPlaceholder')"
                  rows="2"
                  class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-transparent text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <div class="flex gap-2 mt-2">
                  <button
                    type="button"
                    @click="submitReply"
                    :disabled="submitting || !replyContent.trim()"
                    class="px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ submitting ? "..." : $t("admin.posts.commentsModal.submitReply") }}
                  </button>
                  <button
                    type="button"
                    @click="cancelReply"
                    class="px-3 py-1.5 text-sm rounded-lg border border-border text-foreground hover:bg-surface-muted"
                  >
                    {{ $t("common.cancel") }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部快捷回复（根评论） -->
        <div class="p-4 border-t border-border flex-shrink-0">
          <div class="flex gap-2">
            <input
              v-model="rootReplyContent"
              type="text"
              :placeholder="$t('admin.posts.commentsModal.replyPlaceholder')"
              class="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-transparent text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
              @keyup.enter="submitRootReply"
            />
            <button
              type="button"
              @click="submitRootReply"
              :disabled="submittingRoot || !rootReplyContent.trim()"
              class="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submittingRoot ? "..." : $t("admin.posts.commentsModal.addReply") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon, ArrowPathIcon, ChatBubbleLeftIcon } from "@heroicons/vue/24/outline";
import { api } from "~/utils/api";
import { useConfirm } from "~/composables/useConfirm";

const props = defineProps<{
  show: boolean;
  articleId: string;
  articleTitle: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

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
  userId: string | null;
  parentId: string | null;
  user: CommentUser | null;
}

const comments = ref<Comment[]>([]);
const loading = ref(false);
const actionId = ref<string | null>(null);
const replyTarget = ref<Comment | null>(null);
const replyContent = ref("");
const replyTextareaRef = ref<HTMLTextAreaElement | null>(null);
const submitting = ref(false);
const rootReplyContent = ref("");
const submittingRoot = ref(false);

const authorDisplay = (c: Comment) => {
  if (c.user) return c.user.name || c.user.username || "-";
  return c.authorName || c.authorEmail || "-";
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
};

// 将平铺列表转为树形（仅按 parentId 分组排序，子评论紧跟在父评论后）
const commentTree = computed(() => {
  const list = comments.value;
  const roots = list.filter((c) => !c.parentId);
  const byParent = new Map<string | null, Comment[]>();
  byParent.set(null, roots);
  for (const c of list) {
    if (c.parentId) {
      const arr = byParent.get(c.parentId) || [];
      arr.push(c);
      byParent.set(c.parentId, arr);
    }
  }
  const result: Comment[] = [];
  function append(id: string | null) {
    const children = byParent.get(id) || [];
    for (const c of children) {
      result.push(c);
      append(c.id);
    }
  }
  append(null);
  return result;
});

const loadComments = async () => {
  if (!props.articleId || !props.show) return;
  loading.value = true;
  try {
    const list = await api.get<Comment[]>(
      `/api/creator/articles/${props.articleId}/comments`
    );
    comments.value = Array.isArray(list) ? list : [];
  } catch (err: any) {
    console.error("加载评论失败", err);
    comments.value = [];
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  replyTarget.value = null;
  replyContent.value = "";
  rootReplyContent.value = "";
  emit("close");
};

const startReply = (comment: Comment) => {
  replyTarget.value = comment;
  replyContent.value = "";
  nextTick(() => replyTextareaRef.value?.focus());
};

const cancelReply = () => {
  replyTarget.value = null;
  replyContent.value = "";
};

const setApproved = async (item: Comment, approved: boolean) => {
  actionId.value = item.id;
  try {
    await api.patch(`/api/creator/comment/${item.id}`, { isApproved: approved });
    await loadComments();
  } catch (err: any) {
    console.error(err);
  } finally {
    actionId.value = null;
  }
};

const confirmDelete = async (item: Comment) => {
  const ok = await showConfirm({
    title: t("admin.comment.delete"),
    message: t("admin.comment.messages.deleteConfirm"),
    type: "danger",
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
  });
  if (!ok) return;
  actionId.value = item.id;
  try {
    await api.delete(`/api/creator/comment/${item.id}`);
    await loadComments();
  } catch (err: any) {
    console.error(err);
  } finally {
    actionId.value = null;
  }
};

const submitReply = async () => {
  if (!replyTarget.value || !replyContent.value.trim() || submitting.value) return;
  submitting.value = true;
  try {
    await api.post("/api/creator/comment", {
      articleBaseId: props.articleId,
      content: replyContent.value.trim(),
      parentId: replyTarget.value.id,
    });
    replyTarget.value = null;
    replyContent.value = "";
    await loadComments();
  } catch (err: any) {
    console.error(err);
  } finally {
    submitting.value = false;
  }
};

const submitRootReply = async () => {
  if (!rootReplyContent.value.trim() || submittingRoot.value) return;
  submittingRoot.value = true;
  try {
    await api.post("/api/creator/comment", {
      articleBaseId: props.articleId,
      content: rootReplyContent.value.trim(),
      parentId: null,
    });
    rootReplyContent.value = "";
    await loadComments();
  } catch (err: any) {
    console.error(err);
  } finally {
    submittingRoot.value = false;
  }
};

watch(
  () => [props.show, props.articleId],
  () => {
    if (props.show && props.articleId) {
      loadComments();
    } else {
      comments.value = [];
    }
  }
);
</script>
