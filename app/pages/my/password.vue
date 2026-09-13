<template>
  <div class="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-4xl">
    <!-- 修改/设置密码卡片 -->
    <div class="bg-surface text-foreground rounded-lg shadow-md p-6 mb-6 border border-border">
      <h2 class="text-2xl font-bold text-foreground mb-6">
        {{
          hasPassword
            ? $t("password.changePassword")
            : $t("password.setPassword")
        }}
      </h2>

      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <div
          v-if="errorMessage"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
        >
          {{ errorMessage }}
        </div>
        <div
          v-if="successMessage"
          class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
        >
          {{ successMessage }}
        </div>

        <!-- 提示信息：第三方登录用户首次设置密码 -->
        <div
          v-if="!hasPassword"
          class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
        >
          <p class="text-sm">
            {{ $t("password.setPasswordHint") }}
          </p>
        </div>

        <!-- 旧密码输入框（仅在有密码时显示） -->
        <div v-if="hasPassword">
          <label
            class="block text-sm font-medium text-muted mb-2"
          >
            {{ $t("password.oldPassword") }}
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.oldPassword"
            type="password"
            required
            :placeholder="$t('password.oldPasswordPlaceholder')"
            class="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface text-foreground"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-muted mb-2"
          >
            {{ $t("password.newPassword") }}
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.newPassword"
            type="password"
            required
            :placeholder="$t('password.newPasswordPlaceholder')"
            minlength="6"
            class="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface text-foreground"
          />
          <p class="mt-1 text-xs text-muted">
            {{ $t("password.passwordHint") }}
          </p>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-muted mb-2"
          >
            {{ $t("password.confirmPassword") }}
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.confirmPassword"
            type="password"
            required
            :placeholder="$t('password.confirmPasswordPlaceholder')"
            minlength="6"
            class="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface text-foreground"
          />
        </div>

        <div class="flex justify-between gap-3 pt-4">
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
              {{
                loading
                  ? $t("common.loading")
                  : hasPassword
                  ? $t("password.changePassword")
                  : $t("password.setPassword")
              }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  middleware: ["auth"],
});

const { t: $t } = useI18n();
const localePath = useLocalePath();

// 获取用户信息，判断是否有密码
const { data: userResponse } = await useFetch("/api/entry/me");
const userDetail = computed(() => (userResponse.value as any)?.d?.user);
const hasPassword = computed(() => userDetail.value?.hasPassword ?? false);

const form = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const resetForm = () => {
  form.oldPassword = "";
  form.newPassword = "";
  form.confirmPassword = "";
  errorMessage.value = "";
  successMessage.value = "";
};

const handleChangePassword = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  // 验证新密码长度
  if (form.newPassword.length < 6) {
    errorMessage.value = $t("password.passwordTooShort");
    return;
  }

  // 验证两次输入的新密码是否一致
  if (form.newPassword !== form.confirmPassword) {
    errorMessage.value = $t("password.passwordMismatch");
    return;
  }

  // 如果有旧密码，验证新密码不能与旧密码相同
  if (hasPassword.value && form.oldPassword === form.newPassword) {
    errorMessage.value = $t("password.passwordSameAsOld");
    return;
  }

  loading.value = true;

  try {
    const body: any = {
      newPassword: form.newPassword,
    };

    // 只有在有旧密码的情况下才发送 oldPassword
    if (hasPassword.value) {
      body.oldPassword = form.oldPassword;
    }

    const response = await $fetch("/api/entry/me/changepass", {
      method: "POST",
      body,
    });

    if ((response as any).c === 200) {
      successMessage.value = (response as any).m || $t("message.saveSuccess");
      resetForm();
      setTimeout(() => {
        successMessage.value = "";
      }, 3000);
    } else {
      errorMessage.value = (response as any).m || $t("message.saveFailed");
    }
  } catch (err: any) {
    errorMessage.value = err.data?.m || err.message || $t("message.saveFailed");
  } finally {
    loading.value = false;
  }
};
</script>
