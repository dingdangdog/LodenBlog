<template>
  <div class="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-4xl">
    <!-- 用户信息卡片 -->
    <div class="bg-surface text-foreground rounded-lg shadow-md p-6 mb-6 border border-border">
      <div class="flex gap-6 mb-4">
        <!-- 头像 -->
        <div class="relative flex-shrink-0">
          <div class="relative">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="user?.name"
              class="w-24 h-24 rounded-full object-cover border border-border"
            />
            <div
              v-else
              class="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold"
            >
              {{ user?.name?.charAt(0).toUpperCase() || "U" }}
            </div>
            <!-- 编辑头像按钮 -->
            <label
              class="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-lg border-2 border-white dark:border-gray-800"
              :class="{ 'opacity-50 cursor-not-allowed': avatarUploading }"
            >
              <input
                type="file"
                name="avatar"
                class="hidden"
                accept="image/*"
                @change="handleAvatarUpload"
                :disabled="avatarUploading"
              />
              <PencilIcon v-if="!avatarUploading" class="w-4 h-4" />
              <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
            </label>
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="flex-1 flex flex-col justify-center">
          <div class="gap-4 mb-2">
            <div class="flex items-center gap-2">
              <h2
                v-if="!isEditingName"
                class="text-xl font-bold text-gray-900 dark:text-white"
              >
                {{ (user as any)?.name || (user as any)?.username }}
              </h2>
              <div v-else class="flex items-center gap-2 flex-1">
                <input
                  v-model="editingName"
                  type="text"
                  ref="nameInputRef"
                  class="text-xl font-bold px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  @keyup.enter="handleSaveName"
                  @keyup.esc="handleCancelEditName"
                />
                <button
                  @click="handleSaveName"
                  :disabled="nameSaving"
                  class="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                  :title="$t('common.save')"
                >
                  <CheckIcon class="w-5 h-5" />
                </button>
                <button
                  @click="handleCancelEditName"
                  :disabled="nameSaving"
                  class="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  :title="$t('common.cancel')"
                >
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>
              <button
                v-if="!isEditingName"
                @click="handleStartEditName"
                class="p-1 text-muted hover:text-foreground transition-colors"
                :title="$t('common.edit')"
              >
                <PencilIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div class="flex gap-2">
            <span
              :class="[
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                user?.role >= ROLE_LEVEL.ADMIN
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : user?.role >= ROLE_LEVEL.CREATOR
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
              ]"
            >
              {{ getRoleName(user?.role) }}
            </span>

            <!-- 状态标签 -->
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium flex-shrink-0"
              :class="
                user?.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              "
            >
              {{
                user?.isActive ? $t("profile.active") : $t("profile.inactive")
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- 编辑表单 -->
      <form @submit.prevent="handleUpdate" class="space-y-4">
        <div
          v-if="errorMessage"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        >
          {{ errorMessage }}
        </div>
        <div
          v-if="successMessage"
          class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
        >
          {{ successMessage }}
        </div>

        <div>
          <label
            class="block text-sm font-medium text-muted mb-2"
          >
            {{ $t("auth.email") }}
          </label>
          <input
            type="email"
            :value="user?.email"
            disabled
            class="w-full px-4 py-2 border border-border rounded-md bg-surface-muted text-muted cursor-not-allowed"
          />
          <p class="mt-1 text-xs text-muted">
            {{ $t("profile.emailCannotChange") }}
          </p>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-muted mb-2"
          >
            {{ $t("profile.bio") }}
          </label>
          <textarea
            v-model="form.bio"
            rows="4"
            :placeholder="$t('profile.bioPlaceholder')"
            class="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface text-foreground"
          ></textarea>
        </div>

        <div class="flex justify-between gap-3">
          <NuxtLink
            :to="localePath('/my')"
            class="px-6 py-2 border border-border rounded-md text-foreground hover:bg-surface-muted transition-colors"
          >
            {{ $t("common.cancel") }}
          </NuxtLink>
          <div class="flex gap-3">
            <button
              type="button"
              @click="resetForm"
              class="px-6 py-2 border border-border rounded-md text-foreground hover:bg-surface-muted transition-colors"
            >
              {{ $t("common.reset") }}
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ loading ? $t("common.loading") : $t("common.save") }}
            </button>
          </div>
        </div>

        <!-- 注册时间 -->
        <div
          v-if="user?.createdAt"
          class="text-center pt-4 border-t border-border mt-6"
        >
          <p class="text-xs text-muted">
            {{ $t("profile.accountCreated") }}:
            {{ formatDate(user?.createdAt) }}
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ROLE_LEVEL } from "~~/utils/role";
import { normalizeAvatarUrl } from "~/utils/avatar";
import {
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  requiresAuth: true,
  middleware: ["auth"],
});

const { data: session, getSession } = useAuth();
const { t: $t } = useI18n();
const localePath = useLocalePath();

const { data: userResponse, refresh: refreshUser } = await useFetch(
  "/api/entry/me"
);
const userDetail = computed(() => (userResponse.value as any)?.d?.user);

const form = reactive({
  username: "",
  name: "",
  avatar: "",
  bio: "",
});

const user = computed(() => {
  if (!userDetail.value) {
    return session.value?.user;
  }
  return userDetail.value;
});

const avatarUrl = computed(() =>
  normalizeAvatarUrl(form.avatar || user.value?.avatar)
);

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const avatarUploading = ref(false);
const isEditingName = ref(false);
const editingName = ref("");
const nameSaving = ref(false);
const nameInputRef = ref<HTMLInputElement | null>(null);

watch(
  user,
  (newUser) => {
    if (newUser) {
      form.username = (newUser as any).username || "";
      form.name = (newUser as any).name || (newUser as any).username || "";
      form.avatar = newUser.avatar || "";
      form.bio = newUser.bio || "";
    }
  },
  { immediate: true }
);

const resetForm = () => {
  if (user.value) {
    form.username = (user.value as any).username || "";
    form.name = (user.value as any).name || (user.value as any).username || "";
    form.avatar = user.value.avatar || "";
    form.bio = user.value.bio || "";
  }
  errorMessage.value = "";
  successMessage.value = "";
};

const handleAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];
  if (!file) {
    return;
  }
  avatarUploading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await $fetch("/api/entry/avatar", {
      method: "POST",
      body: formData,
    });

    if ((response as any).c === 200) {
      const updatedUser = (response as any).d?.user;
      if (updatedUser) {
        form.avatar = updatedUser.avatar || "";
      }
      successMessage.value = $t("admin.profile.messages.avatarUpdated");
      await refreshUser();
      await getSession();
      setTimeout(() => {
        successMessage.value = "";
      }, 2000);
    } else {
      throw new Error((response as any).m || "上传失败");
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.m || err?.message || "头像上传失败";
  } finally {
    avatarUploading.value = false;
    input.value = "";
  }
};

const handleStartEditName = () => {
  editingName.value =
    (user.value as any)?.name || (user.value as any)?.username || "";
  isEditingName.value = true;
  nextTick(() => {
    nameInputRef.value?.focus();
    nameInputRef.value?.select();
  });
};

const handleCancelEditName = () => {
  isEditingName.value = false;
  editingName.value = "";
};

const handleSaveName = async () => {
  if (nameSaving.value) return;

  const newName = editingName.value.trim();
  if (!newName) {
    errorMessage.value = $t("admin.profile.messages.nameRequired");
    return;
  }

  nameSaving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await $fetch("/api/entry/me", {
      method: "PATCH",
      body: {
        name: newName,
      },
    });

    if ((response as any).c === 200) {
      isEditingName.value = false;
      form.name = newName;
      successMessage.value = $t("message.saveSuccess");
      await refreshUser();
      setTimeout(() => {
        navigateTo(localePath("/my"));
      }, 1000);
    } else {
      errorMessage.value = (response as any).m || $t("message.saveFailed");
    }
  } catch (err: any) {
    errorMessage.value = err.data?.m || err.message || $t("message.saveFailed");
  } finally {
    nameSaving.value = false;
  }
};

const handleUpdate = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  loading.value = true;

  try {
    const response = await $fetch("/api/entry/me", {
      method: "PATCH",
      body: {
        username: form.username,
        avatar: form.avatar || undefined,
        bio: form.bio || undefined,
      },
    });

    if ((response as any).c === 200) {
      successMessage.value = $t("message.saveSuccess");
      setTimeout(() => {
        navigateTo(localePath("/my"));
      }, 1000);
    } else {
      errorMessage.value = (response as any).m || $t("message.saveFailed");
    }
  } catch (err: any) {
    errorMessage.value = err.data?.m || err.message || $t("message.saveFailed");
  } finally {
    loading.value = false;
  }
};

const getRoleName = (role?: number | null) => {
  if (!role || role < ROLE_LEVEL.CREATOR) {
    return $t("profile.roleUser");
  }
  if (role < ROLE_LEVEL.ADMIN) {
    return $t("profile.roleCreator");
  }
  return $t("profile.roleAdmin");
};

const formatDate = (date: any) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};
</script>
