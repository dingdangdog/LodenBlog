<template>
  <section class="mt-10 border-t border-border pt-6">
    <!-- 消息提示 -->
    <div
      v-if="message.text"
      class="mb-4 p-3 rounded-lg text-sm"
      :class="messageClass"
    >
      {{ message.text }}
    </div>

    <h2 class="text-2xl font-semibold mb-6 text-foreground">
      {{ $t("comment.title") }}
    </h2>

    <!-- 未登录提示 -->
    <div
      v-if="!isAuthenticated"
      class="bg-surface rounded-lg p-8 text-center"
    >
      <p class="text-muted mb-4">
        {{ $t("comment.loginPrompt") }}
      </p>
      <NuxtLink
        :to="loginUrl"
        class="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        {{ $t("comment.goToLogin") }}
      </NuxtLink>
    </div>

    <!-- 已登录：评论表单 -->
    <template v-else>
      <!-- 评论表单 -->
      <div class="mb-8">
        <div class="bg-surface rounded-lg p-4">
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-muted text-sm font-medium flex-shrink-0"
            >
              <img
                v-if="currentUserAvatar"
                :src="currentUserAvatar"
                :alt="currentUser?.name || currentUser?.username"
                class="w-10 h-10 rounded-full object-cover"
              />
              <span v-else>
                {{
                  (currentUser?.name || currentUser?.username || "U")
                    .charAt(0)
                    .toUpperCase()
                }}
              </span>
            </div>
            <div class="flex-1">
              <div class="relative">
                <textarea
                  ref="textareaRef"
                  v-model="commentForm.content"
                  :placeholder="$t('comment.placeholder')"
                  :maxlength="200"
                  rows="3"
                  class="w-full px-3 py-2 pr-20 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-foreground resize-none"
                ></textarea>
                <div class="absolute bottom-2 right-2 flex items-center gap-2">
                  <span class="text-xs text-muted">
                    {{ commentForm.content.length }}/200
                  </span>
                  <AppEmojiPicker @select="insertEmoji" />
                </div>
              </div>
              <div class="flex justify-end mt-3">
                <button
                  @click="submitComment"
                  :disabled="submitting || !canSubmit"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{
                    submitting ? $t("comment.submitting") : $t("comment.submit")
                  }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评论列表 -->
      <div
        v-if="loading && rootComments.length === 0"
        class="text-center py-8 text-muted"
      >
        {{ $t("common.loading") }}
      </div>
      <div
        v-else-if="rootComments.length === 0"
        class="text-center py-8 text-muted"
      >
        {{ $t("comment.noComments") }}
      </div>
      <div v-else class="space-y-6">
        <CommentItem
          v-for="comment in rootComments"
          :key="comment.id"
          :comment="comment"
          :article-base-id="articleBaseId"
          @reply="handleReply"
        />
        <div v-if="hasMoreRootComments" class="text-center pt-4">
          <button
            @click="loadMoreRootComments"
            :disabled="loadingMore"
            class="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loadingMore ? $t("common.loading") : $t("comment.loadMore") }}
          </button>
        </div>
        <div
          v-else-if="rootComments.length > 0"
          class="text-center pt-4 text-muted text-sm"
        >
          {{ $t("comment.noMoreComments") }}
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import CommentItem from "./CommentItem.vue";
import { normalizeAvatarUrl } from "~/utils/avatar";
import api from "~/utils/api";
import { usePermission } from "~/composables/usePermission";

const route = useRoute();
const localePath = useLocalePath();
const { isAuthenticated } = usePermission();
const { t: $t } = useI18n();

// 生成带来源URL的登录链接
const loginUrl = computed(() => {
  if (process.client) {
    // 获取当前页面的完整URL（包括路径和查询参数）
    const currentUrl = window.location.pathname + window.location.search;
    return localePath(`/login?from=${encodeURIComponent(currentUrl)}`);
  }
  // SSR时使用当前路由
  const currentPath = route.fullPath;
  return localePath(`/login?from=${encodeURIComponent(currentPath)}`);
});

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  authorUrl?: string;
  userId?: string;
  parentId?: string | null;
  avatar?: string | null;
  username?: string | null;
  createdAt: string;
  updatedAt: string;
  childCount: number;
}

const props = defineProps<{
  articleBaseId: string;
}>();

const { data: session } = useAuth();
const currentUser = computed(() => session.value?.user as any);
const currentUserAvatar = computed(() =>
  normalizeAvatarUrl((currentUser.value as any)?.avatar || "")
);

const commentForm = reactive({
  content: "",
  parentId: null as string | null,
});

const rootComments = ref<Comment[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const submitting = ref(false);
const currentPage = ref(1);
const hasMoreRootComments = ref(false);

// 消息提示
const message = reactive({
  text: "",
  type: "error" as "success" | "error",
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

// 用于刷新子评论的函数映射
const childCommentRefreshMap = new Map<string, () => void>();

// 注册子评论刷新函数
const registerChildRefresh = (parentId: string, refreshFn: () => void) => {
  childCommentRefreshMap.set(parentId, refreshFn);
};

// 刷新子评论
const refreshChildComments = (parentId: string) => {
  const refreshFn = childCommentRefreshMap.get(parentId);
  if (refreshFn) {
    refreshFn();
  }
};

// 提供注册函数给子组件
provide("registerChildRefresh", registerChildRefresh);

const canSubmit = computed(() => {
  if (!isAuthenticated.value) return false;
  if (!commentForm.content.trim()) return false;
  // 已登录用户只需要内容不为空即可
  return true;
});

// 加载根评论
const loadRootComments = async (page: number = 1, append: boolean = false) => {
  if (loading.value || loadingMore.value) return;

  if (page === 1) {
    loading.value = true;
  } else {
    loadingMore.value = true;
  }

  try {
    const result = await api.get<{
      items: Comment[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>("/api/entry/comment", {
      query: {
        articleBaseId: props.articleBaseId,
        parentId: "0", // 根评论
        page,
        pageSize: 10,
      },
    });

    if (append) {
      rootComments.value.push(...result.items);
    } else {
      rootComments.value = result.items;
    }

    currentPage.value = result.pagination.page;
    hasMoreRootComments.value = result.pagination.hasMore;
  } catch (error: any) {
    console.error("加载评论失败:", error);
    // 可以显示错误提示
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 加载更多根评论
const loadMoreRootComments = () => {
  loadRootComments(currentPage.value + 1, true);
};

// 提交评论
const submitComment = async () => {
  if (!canSubmit.value || submitting.value) return;

  submitting.value = true;

  try {
    const result = await api.post<Comment>("/api/entry/comment", {
      articleBaseId: props.articleBaseId,
      content: commentForm.content.trim(),
      parentId: commentForm.parentId || null,
    });

    // 如果是根评论，重新加载第一页以确保数据一致
    if (!commentForm.parentId || commentForm.parentId === "0") {
      await loadRootComments(1, false);
    } else {
      // 如果是子评论，通知对应的CommentItem刷新子评论
      refreshChildComments(commentForm.parentId);
      // 同时重新加载根评论以确保childCount更新
      await loadRootComments(1, false);
    }

    // 保存parentId用于滚动
    const replyParentId = commentForm.parentId;

    // 重置表单
    commentForm.content = "";
    commentForm.parentId = null;

    // 如果是回复，滚动到对应的评论
    if (replyParentId && replyParentId !== "0") {
      nextTick(() => {
        const commentElement = document.querySelector(
          `[data-comment-id="${replyParentId}"]`
        );
        if (commentElement) {
          commentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      });
    }
  } catch (error: any) {
    console.error("提交评论失败:", error);
    setMessage(error.message || $t("comment.submitFailed"), "error");
  } finally {
    submitting.value = false;
  }
};

const textareaRef = ref<HTMLTextAreaElement | null>(null);

// 插入emoji
const insertEmoji = (emoji: string) => {
  const textarea = textareaRef.value;
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = commentForm.content;
    commentForm.content =
      text.substring(0, start) + emoji + text.substring(end);
    // 恢复光标位置
    nextTick(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  } else {
    commentForm.content += emoji;
  }
};

// 处理回复
const handleReply = (parentId: string, authorName: string) => {
  commentForm.parentId = parentId;
  commentForm.content = `@${authorName} `;
  // 滚动到评论表单
  nextTick(() => {
    const form = document.querySelector("textarea");
    if (form) {
      form.focus();
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
};

// 初始化加载（只有登录后才加载）
onMounted(() => {
  if (isAuthenticated.value) {
    loadRootComments(1);
  }
});

// 监听登录状态变化
watch(isAuthenticated, (newVal) => {
  if (newVal) {
    // 登录后加载评论
    loadRootComments(1);
  } else {
    // 登出后清空评论
    rootComments.value = [];
  }
});
</script>
