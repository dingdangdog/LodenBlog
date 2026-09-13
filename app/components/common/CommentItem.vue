<template>
  <div
    :data-comment-id="comment.id"
    class="border-b border-border pb-4 last:border-b-0"
  >
    <div class="flex items-start gap-3">
      <!-- 头像 -->
      <div class="flex-shrink-0">
        <img
          v-if="comment.avatar"
          :src="normalizeAvatarUrl(comment.avatar)"
          :alt="comment.authorName"
          class="w-10 h-10 rounded-full object-cover border border-border"
        />
        <div
          v-else
          class="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-muted text-sm font-medium"
        >
          {{ comment.authorName?.charAt(0)?.toUpperCase() || "?" }}
        </div>
      </div>

      <!-- 评论内容 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-medium text-foreground">
            {{ comment.authorName }}
          </span>
          <span
            v-if="comment.username"
            class="text-xs text-muted"
          >
            @{{ comment.username }}
          </span>
          <span class="text-xs text-muted">
            {{ formatDate(comment.createdAt) }}
          </span>
        </div>
        <p
          class="text-foreground whitespace-pre-wrap break-words mb-2"
        >
          {{ comment.content }}
        </p>
        <div class="flex items-center gap-4">
          <button
            @click="handleReply"
            class="text-sm text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {{ $t("common.reply") }}
          </button>
        </div>

        <!-- 子评论 -->
        <div
          v-if="showChildren"
          class="mt-4 space-y-4 pl-4 border-l-2 border-border"
        >
          <CommentItem
            v-for="child in childComments"
            :key="child.id"
            :comment="child"
            :article-base-id="articleBaseId"
            @reply="handleChildReply"
          />
          <div v-if="hasMoreChildren" class="text-center pt-2">
            <button
              @click="loadMoreChildren"
              :disabled="loadingMoreChildren"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ loadingMoreChildren ? $t("common.loading") : $t("common.loadMore") }}
            </button>
          </div>
        </div>

        <!-- 展开讨论按钮 -->
        <div v-else-if="comment.childCount > 0" class="mt-2">
          <button
            @click="expandChildren"
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {{ $t("common.expandDiscussion") }} ({{ comment.childCount }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { normalizeAvatarUrl } from "~/utils/avatar";
import api from "~/utils/api";

const { t } = useI18n();

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
  comment: Comment;
  articleBaseId: string;
}>();

const emit = defineEmits<{
  reply: [parentId: string, authorName: string];
}>();

// 注入注册函数
const registerChildRefresh = inject<
  ((parentId: string, refreshFn: () => void) => void) | undefined
>("registerChildRefresh");

const showChildren = ref(false);
const childComments = ref<Comment[]>([]);
const loadingMoreChildren = ref(false);
const currentChildPage = ref(1);
const hasMoreChildren = ref(false);

// 展开子评论
const expandChildren = async () => {
  if (showChildren.value) return;
  showChildren.value = true;
  await loadChildren(1);
  // 注册刷新函数
  if (registerChildRefresh) {
    registerChildRefresh(props.comment.id, async () => {
      await loadChildren(1, false);
    });
  }
};

// 加载子评论
const loadChildren = async (page: number = 1, append: boolean = false) => {
  if (loadingMoreChildren.value) return;

  loadingMoreChildren.value = true;

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
        parentId: props.comment.id,
        page,
        pageSize: 10,
      },
    });

    if (append) {
      childComments.value.push(...result.items);
    } else {
      childComments.value = result.items;
    }

    currentChildPage.value = result.pagination.page;
    hasMoreChildren.value = result.pagination.hasMore;
  } catch (error: any) {
    console.error("加载子评论失败:", error);
  } finally {
    loadingMoreChildren.value = false;
  }
};

// 加载更多子评论
const loadMoreChildren = () => {
  loadChildren(currentChildPage.value + 1, true);
};

// 处理回复
const handleReply = () => {
  emit("reply", props.comment.id, props.comment.authorName);
};

// 处理子评论回复（直接向上传递）
const handleChildReply = (parentId: string, authorName: string) => {
  emit("reply", parentId, authorName);
};

// 格式化日期
const formatDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return d.toLocaleDateString();
  } else if (days > 0) {
    return t("common.daysAgo", { count: days });
  } else if (hours > 0) {
    return t("common.hoursAgo", { count: hours });
  } else if (minutes > 0) {
    return t("common.minutesAgo", { count: minutes });
  } else {
    return t("common.justNow");
  }
};
</script>
