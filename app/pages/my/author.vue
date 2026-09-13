<template>
  <div class="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-4xl">
    <!-- 创作者信息卡片 -->
    <div class="bg-surface text-foreground rounded-lg shadow-md p-6 mb-6 border border-border">
      <div class="flex gap-6 mb-4">
        <!-- 创作者头像 -->
        <div class="relative flex-shrink-0">
          <div class="relative">
            <img
              v-if="creatorAvatarUrl"
              :src="creatorAvatarUrl"
              :alt="creatorForm.penName"
              class="w-24 h-24 rounded-full object-cover border border-border"
            />
            <div
              v-else
              class="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold"
            >
              {{ creatorForm.penName?.charAt(0)?.toUpperCase() || "C" }}
            </div>
            <!-- 编辑头像按钮 -->
            <label
              class="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-lg border-2 border-white dark:border-gray-800"
              :class="{
                'opacity-50 cursor-not-allowed': creatorAvatarUploading,
              }"
            >
              <input
                type="file"
                name="creatorAvatar"
                class="hidden"
                accept="image/*"
                @change="handleCreatorAvatarUpload"
                :disabled="creatorAvatarUploading"
              />
              <PencilIcon v-if="!creatorAvatarUploading" class="w-4 h-4" />
              <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
            </label>
          </div>
        </div>

        <!-- 创作者信息 -->
        <div class="flex-1 flex flex-col justify-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {{ creatorForm.penName || $t("admin.profile.creator.notSet") }}
          </h2>
          <div class="flex gap-2">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              {{ $t("admin.profile.creator.role") }}
            </span>
          </div>
        </div>
      </div>

      <!-- 一键同步按钮 -->
      <div
        class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-blue-900 dark:text-blue-200">
              {{ $t("admin.profile.creator.syncTitle") }}
            </p>
            <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {{ $t("admin.profile.creator.syncDescription") }}
            </p>
          </div>
          <button
            type="button"
            @click="handleSyncFromUser"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <ArrowPathIcon class="w-4 h-4" />
            {{ $t("admin.profile.creator.sync") }}
          </button>
        </div>
      </div>

      <!-- 编辑表单 -->
      <form @submit.prevent="handleCreatorUpdate" class="space-y-4">
        <div
          v-if="creatorErrorMessage"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        >
          {{ creatorErrorMessage }}
        </div>
        <div
          v-if="creatorSuccessMessage"
          class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
        >
          {{ creatorSuccessMessage }}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              class="block text-sm font-medium text-muted mb-2"
            >
              {{ $t("admin.profile.creator.key") }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="creatorForm.key"
              type="text"
              :placeholder="$t('admin.profile.creator.keyPlaceholder')"
              class="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface text-foreground"
              pattern="[a-zA-Z_]+"
              @input="(e) => { const v = (e.target as HTMLInputElement).value; creatorForm.key = v.replace(/[^a-zA-Z_]/g, ''); (e.target as HTMLInputElement).value = creatorForm.key; }"
            />
            <p class="mt-1 text-xs text-muted">
              {{ $t("admin.profile.creator.keyHint") }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-muted mb-2"
            >
              {{ $t("admin.profile.creator.penName") }}
            </label>
            <input
              v-model="creatorForm.penName"
              type="text"
              required
              class="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface text-foreground"
            />
          </div>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-muted mb-2"
          >
            {{ $t("admin.profile.creator.bio") }}
          </label>
          <textarea
            v-model="creatorForm.bio"
            rows="4"
            :placeholder="$t('admin.profile.creator.bioPlaceholder')"
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
              @click="resetCreatorForm"
              class="px-6 py-2 border border-border rounded-md text-foreground hover:bg-surface-muted transition-colors"
            >
              {{ $t("common.reset") }}
            </button>
            <button
              type="submit"
              :disabled="creatorLoading"
              class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ creatorLoading ? $t("common.loading") : $t("common.save") }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ROLE_LEVEL } from "~~/utils/role";
import { normalizeAvatarUrl } from "~/utils/avatar";
import { PencilIcon, ArrowPathIcon } from "@heroicons/vue/24/outline";

definePageMeta({
  requiresAuth: true,
  middleware: ["auth", "creator"],
});

const { data: session } = useAuth();
const { t: $t } = useI18n();
const localePath = useLocalePath();

const { data: userResponse } = await useFetch("/api/entry/me");
const userDetail = computed(() => (userResponse.value as any)?.d?.user);

const { data: creatorResponse, refresh: refreshCreator } = await useFetch(
  "/api/entry/creator",
  {
    default: () => ({ c: 200, m: "success", d: { creator: null } }),
  }
);
const creatorDetail = computed(
  () => (creatorResponse.value as any)?.d?.creator
);

const user = computed(() => {
  if (!userDetail.value) {
    return session.value?.user;
  }
  return userDetail.value;
});

const creatorAvatarUrl = computed(() =>
  normalizeAvatarUrl(creatorForm.avatar || creatorDetail.value?.avatar)
);

// 创作者相关状态
const creatorForm = reactive({
  key: "",
  penName: "",
  avatar: "",
  bio: "",
});
const creatorLoading = ref(false);
const creatorErrorMessage = ref("");
const creatorSuccessMessage = ref("");
const creatorAvatarUploading = ref(false);

watch(
  creatorDetail,
  (newCreator) => {
    if (newCreator) {
      creatorForm.key = newCreator.key || "";
      creatorForm.penName = newCreator.penName || "";
      creatorForm.avatar = newCreator.avatar || "";
      creatorForm.bio = newCreator.bio || "";
    }
  },
  { immediate: true }
);

// 创作者相关方法
const resetCreatorForm = () => {
  if (creatorDetail.value) {
    creatorForm.key = creatorDetail.value.key || "";
    creatorForm.penName = creatorDetail.value.penName || "";
    creatorForm.avatar = creatorDetail.value.avatar || "";
    creatorForm.bio = creatorDetail.value.bio || "";
  }
  creatorErrorMessage.value = "";
  creatorSuccessMessage.value = "";
};

const handleCreatorAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];
  if (!file) {
    return;
  }
  creatorAvatarUploading.value = true;
  creatorErrorMessage.value = "";
  creatorSuccessMessage.value = "";

  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await $fetch("/api/entry/creator/avatar", {
      method: "POST",
      body: formData,
    });

    if ((response as any).c === 200) {
      const updatedCreator = (response as any).d?.creator;
      if (updatedCreator) {
        creatorForm.avatar = updatedCreator.avatar || "";
      }
      creatorSuccessMessage.value = $t("admin.profile.messages.avatarUpdated");
      await refreshCreator();
      setTimeout(() => {
        creatorSuccessMessage.value = "";
      }, 2000);
    } else {
      throw new Error((response as any).m || $t("message.saveFailed"));
    }
  } catch (err: any) {
    creatorErrorMessage.value =
      err?.data?.m || err?.message || $t("message.saveFailed");
  } finally {
    creatorAvatarUploading.value = false;
    input.value = "";
  }
};

const handleSyncFromUser = () => {
  if (!user.value) {
    creatorErrorMessage.value = $t("admin.profile.messages.userNotFound");
    return;
  }

  // 直接使用页面已有的用户数据填充表单
  const currentUser = user.value as any;

  // 同步笔名和头像
  creatorForm.penName = currentUser.name || currentUser.username || "";
  creatorForm.avatar = currentUser.avatar || "";

  // 如果当前没有 key，使用 username 作为建议的 key（仅保留英文和下划线）
  if (!creatorForm.key && currentUser.username) {
    const keyFromUsername = currentUser.username.replace(/[^a-zA-Z_]/g, "");
    if (keyFromUsername && /^[a-zA-Z_]+$/.test(keyFromUsername)) {
      creatorForm.key = keyFromUsername;
    } else {
      creatorForm.key = `user_${currentUser.id?.slice(0, 8) || "default"}`;
    }
  }

  creatorSuccessMessage.value = $t("admin.profile.messages.syncSuccess");
  setTimeout(() => {
    creatorSuccessMessage.value = "";
  }, 3000);
};

const handleCreatorUpdate = async () => {
  creatorErrorMessage.value = "";
  creatorSuccessMessage.value = "";
  creatorLoading.value = true;

  try {
    const response = await $fetch("/api/entry/creator", {
      method: "PATCH",
      body: {
        key: creatorForm.key || undefined,
        penName: creatorForm.penName,
        avatar: creatorForm.avatar || undefined,
        bio: creatorForm.bio || undefined,
      },
    });

    if ((response as any).c === 200) {
      creatorSuccessMessage.value = $t("message.saveSuccess");
      await refreshCreator();
      setTimeout(() => {
        navigateTo(localePath("/my"));
      }, 1000);
    } else {
      creatorErrorMessage.value =
        (response as any).m || $t("message.saveFailed");
    }
  } catch (err: any) {
    creatorErrorMessage.value =
      err.data?.m || err.message || $t("message.saveFailed");
  } finally {
    creatorLoading.value = false;
  }
};
</script>
