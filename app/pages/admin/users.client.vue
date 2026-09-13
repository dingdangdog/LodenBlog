<template>
  <div class="space-y-8">
    <!-- 消息提示 -->
    <div v-if="message.text" class="mx-6 p-3 rounded-lg text-sm" :class="messageClass">
      {{ message.text }}
    </div>

    <!-- 用户管理 -->
    <section class="bg-surface text-foreground rounded-2xl border border-border p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t('admin.users.title') }}
        </h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t('admin.users.table.username') }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t('admin.users.table.name') }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t('admin.users.table.email') }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t('admin.users.table.role') }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t('admin.users.table.creator') }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t('admin.users.table.status') }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">
                {{ $t('admin.users.table.createdAt') }}
              </th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-muted">
                {{ $t('admin.users.table.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="listLoading" class="border-b border-border">
              <td colspan="8" class="py-12 text-center text-muted">
                <span class="inline-flex flex-col items-center gap-2">
                  <ArrowPathIcon class="w-8 h-8 animate-spin" />
                  <span class="text-sm">{{ $t('common.loading') }}</span>
                </span>
              </td>
            </tr>
            <tr v-else v-for="user in users" :key="user.id" class="border-b border-border hover:bg-surface-muted">
              <td class="py-3 px-4 text-sm text-foreground">
                {{ user.username }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ user.name || "-" }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ user.email }}
              </td>
              <td class="py-3 px-4">
                <span :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  getRoleClass(user.role),
                ]">
                  {{ getRoleName(user.role) }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span v-if="user.creator" :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                ]">
                  {{ user.creator.penName || user.creator.key }}
                </span>
                <span v-else class="px-2 py-1 rounded text-xs font-medium bg-surface-muted text-muted">
                  {{ $t('admin.users.table.noCreator') }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  user.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-surface-muted text-muted',
                ]">
                  {{ user.isActive ? $t('admin.users.status.active') : $t('admin.users.status.inactive') }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="py-3 px-4 text-right">
                <button v-if="!user.hasCreatorPermission" @click="grantCreatorPermission(user)"
                  class="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  :disabled="grantingUserId === user.id || revokingUserId === user.id">
                  <span v-if="grantingUserId === user.id">
                    {{ $t('admin.users.actions.granting') }}
                  </span>
                  <span v-else>
                    {{ $t('admin.users.actions.grantCreator') }}
                  </span>
                </button>
                <button v-else-if="user.role >= 2 && user.role < 99" @click="revokeCreatorPermission(user)"
                  class="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  :disabled="grantingUserId === user.id || revokingUserId === user.id">
                  <span v-if="revokingUserId === user.id">
                    {{ $t('admin.users.actions.revoking') }}
                  </span>
                  <span v-else>
                    {{ $t('admin.users.actions.revokeCreator') }}
                  </span>
                </button>
                <span v-else class="px-3 py-1 text-sm text-muted">
                  {{ $t('admin.users.actions.alreadyCreator') }}
                </span>
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

interface Creator {
  userId: string;
  key: string;
  penName: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
  role: number;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  creator: Creator | null;
  hasCreatorPermission: boolean;
}

const users = ref<User[]>([]);
const listLoading = ref(false);
const grantingUserId = ref<string | null>(null);
const revokingUserId = ref<string | null>(null);

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

const getRoleName = (role: number): string => {
  if (role >= 99) {
    return t('admin.users.role.admin');
  } else if (role >= 2) {
    return t('admin.users.role.creator');
  } else {
    return t('admin.users.role.user');
  }
};

const getRoleClass = (role: number): string => {
  if (role >= 99) {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
  } else if (role >= 2) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  } else {
    return "bg-surface-muted text-muted";
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const loadUsers = async () => {
  listLoading.value = true;
  try {
    users.value = await api.get<User[]>("/api/admin/users");
  } catch (error: any) {
    console.error("加载用户列表失败:", error);
    setMessage(error.message || t('admin.users.messages.loadFailed'), "error");
  } finally {
    listLoading.value = false;
  }
};

const grantCreatorPermission = async (user: User) => {
  const confirmed = await showConfirm({
    title: t('admin.users.actions.grantCreator'),
    message: t('admin.users.messages.grantConfirm', {
      username: user.username || user.email,
    }),
    type: "info",
    confirmText: t("common.confirm"),
    cancelText: t("common.cancel"),
  });

  if (!confirmed) {
    return;
  }

  grantingUserId.value = user.id;
  try {
    await api.post(`/api/admin/users/${user.id}/grant-creator`);
    await loadUsers();
    setMessage(t('admin.users.messages.grantSuccess'), "success");
  } catch (error: any) {
    console.error("授予创作者权限失败:", error);
    setMessage(error.message || t('admin.users.messages.grantFailed'), "error");
  } finally {
    grantingUserId.value = null;
  }
};

const revokeCreatorPermission = async (user: User) => {
  const confirmed = await showConfirm({
    title: t('admin.users.actions.revokeCreator'),
    message: t('admin.users.messages.revokeConfirm', {
      username: user.username || user.email,
    }),
    type: "warning",
    confirmText: t("common.confirm"),
    cancelText: t("common.cancel"),
  });

  if (!confirmed) {
    return;
  }

  revokingUserId.value = user.id;
  try {
    await api.post(`/api/admin/users/${user.id}/revoke-creator`);
    await loadUsers();
    setMessage(t('admin.users.messages.revokeSuccess'), "success");
  } catch (error: any) {
    console.error("撤销创作者权限失败:", error);
    setMessage(error.message || t('admin.users.messages.revokeFailed'), "error");
  } finally {
    revokingUserId.value = null;
  }
};

onMounted(() => {
  loadUsers();
});
</script>
