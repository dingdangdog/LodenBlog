<template>
  <div class="space-y-6">
    <!-- 消息提示 -->
    <div v-if="message.text" class="p-3 rounded-lg text-sm" :class="message.type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
      ">
      {{ message.text }}
    </div>

    <!-- 站点基本信息 | LOGO&图标（宽屏同行，窄屏上下） -->
    <div class="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <!-- 左：站点基本信息 -->
      <div class="flex-1 min-w-0 space-y-4">
        <h3 class="text-base font-semibold text-foreground">
          {{ $t("admin.settings.site.basicInfo") }}
        </h3>

        <div>
          <label class="block text-sm font-medium text-muted mb-2">
            {{ $t("admin.settings.site.title") }}
            <span class="text-red-500">*</span>
          </label>
          <input v-model="form.title" type="text" required
            class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
            :placeholder="$t('admin.settings.site.titlePlaceholder')" />
        </div>

        <div>
          <label class="block text-sm font-medium text-muted mb-2">
            {{ $t("admin.settings.site.description") }}
          </label>
          <textarea v-model="form.description" rows="3"
            class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
            :placeholder="$t('admin.settings.site.descriptionPlaceholder')"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-muted mb-2">
            {{ $t("admin.settings.site.keyword") }}
          </label>
          <input v-model="form.keyword" type="text"
            class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
            :placeholder="$t('admin.settings.site.keywordPlaceholder')" />
          <p class="mt-1 text-xs text-muted">
            {{ $t("admin.settings.site.keywordHint") }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-muted mb-2">
            {{ $t("admin.settings.site.domain") }}
          </label>
          <input v-model="form.domain" type="text"
            class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
            :placeholder="$t('admin.settings.site.domainPlaceholder')" />
        </div>
      </div>

      <!-- 右：LOGO设置 & 网站图标设置 -->
      <div class="flex-1 min-w-0 space-y-6">
        <!-- Logo设置 -->
        <div class="space-y-4 pt-4 border-t border-border lg:pt-0 lg:border-t-0">
          <h3 class="text-base font-semibold text-foreground">
            {{ $t("admin.settings.brand.logoTitle") }}
          </h3>

          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.settings.brand.logoLight") }}
            </label>
            <div class="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <!-- 左侧预览区域 -->
              <div
                class="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-border bg-surface flex items-center justify-center relative">
                <img v-if="form.logoLight" :src="form.logoLight" alt="亮色Logo预览" class="w-full h-full object-contain" />
                <span v-else class="text-xs text-muted">
                  {{ $t("admin.settings.brand.logoPreview") }}
                </span>
                <!-- 上传中覆盖层 -->
                <div v-if="uploading.logoLight"
                  class="absolute inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center backdrop-blur-sm">
                  <ArrowPathIcon class="w-6 h-6 text-white animate-spin" />
                </div>
              </div>
              <!-- 右侧输入和上传 -->
              <div class="flex-1 min-w-0 space-y-2">
                <input v-model="form.logoLight" type="url" :disabled="uploading.logoLight"
                  class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  :placeholder="$t('admin.settings.brand.logoLightPlaceholder')" />
                <label :class="[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium',
                  uploading.logoLight
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                ]">
                  <ArrowPathIcon v-if="uploading.logoLight" class="w-4 h-4 animate-spin" />
                  <PhotoIcon v-else class="w-4 h-4" />
                  {{
                    uploading.logoLight
                      ? $t("admin.settings.actions.uploading")
                      : $t("admin.settings.brand.uploadImage")
                  }}
                  <input type="file" class="hidden" accept="image/*" :disabled="uploading.logoLight"
                    @change="(e) => handleLogoUpload(e, 'light')" />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.settings.brand.logoDark") }}
            </label>
            <div class="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <!-- 左侧预览区域 -->
              <div
                class="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-border bg-surface-muted flex items-center justify-center relative">
                <img v-if="form.logoDark" :src="form.logoDark" alt="暗色Logo预览" class="w-full h-full object-contain" />
                <span v-else class="text-xs text-muted">
                  {{ $t("admin.settings.brand.logoPreview") }}
                </span>
                <!-- 上传中覆盖层 -->
                <div v-if="uploading.logoDark"
                  class="absolute inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center backdrop-blur-sm">
                  <ArrowPathIcon class="w-6 h-6 text-white animate-spin" />
                </div>
              </div>
              <!-- 右侧输入和上传 -->
              <div class="flex-1 min-w-0 space-y-2">
                <input v-model="form.logoDark" type="url" :disabled="uploading.logoDark"
                  class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  :placeholder="$t('admin.settings.brand.logoDarkPlaceholder')" />
                <label :class="[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium',
                  uploading.logoDark
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                ]">
                  <ArrowPathIcon v-if="uploading.logoDark" class="w-4 h-4 animate-spin" />
                  <PhotoIcon v-else class="w-4 h-4" />
                  {{
                    uploading.logoDark
                      ? $t("admin.settings.actions.uploading")
                      : $t("admin.settings.brand.uploadImage")
                  }}
                  <input type="file" class="hidden" accept="image/*" :disabled="uploading.logoDark"
                    @change="(e) => handleLogoUpload(e, 'dark')" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 图标设置 -->
        <div class="space-y-4 pt-4 border-t border-border">
          <h3 class="text-base font-semibold text-foreground">
            {{ $t("admin.settings.brand.iconTitle") }}
          </h3>

          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.settings.brand.iconLight") }}
            </label>
            <div class="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <!-- 左侧预览区域 -->
              <div
                class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border bg-surface flex items-center justify-center relative">
                <img v-if="form.iconLight" :src="form.iconLight" alt="亮色图标预览" class="w-full h-full object-contain" />
                <span v-else class="text-xs text-muted">
                  {{ $t("admin.settings.brand.logoPreview") }}
                </span>
                <!-- 上传中覆盖层 -->
                <div v-if="uploading.iconLight"
                  class="absolute inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center backdrop-blur-sm">
                  <ArrowPathIcon class="w-5 h-5 text-white animate-spin" />
                </div>
              </div>
              <!-- 右侧输入和上传 -->
              <div class="flex-1 min-w-0 space-y-2">
                <input v-model="form.iconLight" type="url" :disabled="uploading.iconLight"
                  class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  :placeholder="$t('admin.settings.brand.iconLightPlaceholder')" />
                <label :class="[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium',
                  uploading.iconLight
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                ]">
                  <ArrowPathIcon v-if="uploading.iconLight" class="w-4 h-4 animate-spin" />
                  <PhotoIcon v-else class="w-4 h-4" />
                  {{
                    uploading.iconLight
                      ? $t("admin.settings.actions.uploading")
                      : $t("admin.settings.brand.uploadImage")
                  }}
                  <input type="file" class="hidden" accept="image/*" :disabled="uploading.iconLight"
                    @change="(e) => handleIconUpload(e, 'light')" />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.settings.brand.iconDark") }}
            </label>
            <div class="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <!-- 左侧预览区域 -->
              <div
                class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border bg-surface-muted flex items-center justify-center relative">
                <img v-if="form.iconDark" :src="form.iconDark" alt="暗色图标预览" class="w-full h-full object-contain" />
                <span v-else class="text-xs text-muted">
                  {{ $t("admin.settings.brand.logoPreview") }}
                </span>
                <!-- 上传中覆盖层 -->
                <div v-if="uploading.iconDark"
                  class="absolute inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center backdrop-blur-sm">
                  <ArrowPathIcon class="w-5 h-5 text-white animate-spin" />
                </div>
              </div>
              <!-- 右侧输入和上传 -->
              <div class="flex-1 min-w-0 space-y-2">
                <input v-model="form.iconDark" type="url" :disabled="uploading.iconDark"
                  class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  :placeholder="$t('admin.settings.brand.iconDarkPlaceholder')" />
                <label :class="[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium',
                  uploading.iconDark
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                ]">
                  <ArrowPathIcon v-if="uploading.iconDark" class="w-4 h-4 animate-spin" />
                  <PhotoIcon v-else class="w-4 h-4" />
                  {{
                    uploading.iconDark
                      ? $t("admin.settings.actions.uploading")
                      : $t("admin.settings.brand.uploadImage")
                  }}
                  <input type="file" class="hidden" accept="image/*" :disabled="uploading.iconDark"
                    @change="(e) => handleIconUpload(e, 'dark')" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
      <button type="button" @click="handleReset"
        class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
        {{ $t("admin.settings.actions.reset") }}
      </button>
      <button type="button" @click="handleSave" :disabled="saving"
        class="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
        <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
        {{
          saving
            ? $t("admin.settings.actions.saving")
            : $t("admin.settings.actions.save")
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, PhotoIcon } from "@heroicons/vue/24/outline";

const { t } = useI18n();

const saving = ref(false);
const message = ref<{ text: string; type: "success" | "error" | "" }>({
  text: "",
  type: "",
});

// 上传状态管理
const uploading = reactive({
  logoLight: false,
  logoDark: false,
  iconLight: false,
  iconDark: false,
});

const form = reactive({
  title: "",
  description: "",
  keyword: "",
  domain: null as string | null,
  logoLight: null as string | null,
  logoDark: null as string | null,
  iconLight: null as string | null,
  iconDark: null as string | null,
});

const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: "", type: "" };
  }, 3000);
};

// 加载设置数据
const loadSettings = async () => {
  try {
    const response: any = await $fetch("/api/admin/settings");
    if (response?.c === 200 && response.d) {
      form.title = response.d.title || "";
      form.description = response.d.description || "";
      form.keyword = response.d.keyword || "";
      form.domain = response.d.domain ?? null;
      form.logoLight = response.d.logoLight || null;
      form.logoDark = response.d.logoDark || null;
      form.iconLight = response.d.iconLight || null;
      form.iconDark = response.d.iconDark || null;
    }
  } catch (err: any) {
    console.error(t("admin.settings.actions.loadFailed"), err);
  }
};

// 上传Logo
const handleLogoUpload = async (event: Event, mode: "light" | "dark") => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) {
    return;
  }

  const file = target.files[0];
  if (!file) {
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", `logo-${mode}`);

  // 设置上传状态
  if (mode === "light") {
    uploading.logoLight = true;
  } else {
    uploading.logoDark = true;
  }

  try {
    const response: any = await $fetch("/api/admin/logo", {
      method: "POST",
      body: formData,
    });

    if (response?.c === 200) {
      if (mode === "light") {
        form.logoLight = response.d.url;
        setMessage(
          t("admin.settings.actions.logoUploadSuccess.light"),
          "success"
        );
      } else {
        form.logoDark = response.d.url;
        setMessage(
          t("admin.settings.actions.logoUploadSuccess.dark"),
          "success"
        );
      }
    } else {
      setMessage(response?.m || t("admin.settings.actions.logoUploadFailed"));
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.settings.actions.logoUploadFailed"));
  } finally {
    if (mode === "light") {
      uploading.logoLight = false;
    } else {
      uploading.logoDark = false;
    }
    target.value = "";
  }
};

// 上传Icon
const handleIconUpload = async (event: Event, mode: "light" | "dark") => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) {
    return;
  }

  const file = target.files[0];
  if (!file) {
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", `icon-${mode}`);

  // 设置上传状态
  if (mode === "light") {
    uploading.iconLight = true;
  } else {
    uploading.iconDark = true;
  }

  try {
    const response: any = await $fetch("/api/admin/logo", {
      method: "POST",
      body: formData,
    });

    if (response?.c === 200) {
      if (mode === "light") {
        form.iconLight = response.d.url;
        setMessage(
          t("admin.settings.actions.iconUploadSuccess.light"),
          "success"
        );
      } else {
        form.iconDark = response.d.url;
        setMessage(
          t("admin.settings.actions.iconUploadSuccess.dark"),
          "success"
        );
      }
    } else {
      setMessage(response?.m || t("admin.settings.actions.iconUploadFailed"));
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.settings.actions.iconUploadFailed"));
  } finally {
    if (mode === "light") {
      uploading.iconLight = false;
    } else {
      uploading.iconDark = false;
    }
    target.value = "";
  }
};

// 重置表单
const handleReset = async () => {
  await loadSettings();
  setMessage(t("admin.settings.actions.resetSuccess"), "success");
};

// 保存表单
const handleSave = async () => {
  if (!form.title) {
    setMessage(t("admin.settings.actions.fillRequired"));
    return;
  }

  saving.value = true;

  try {
    const payload: any = {
      title: form.title,
      description: form.description,
      keyword: form.keyword,
      domain: form.domain,
      logoLight: form.logoLight,
      logoDark: form.logoDark,
      iconLight: form.iconLight,
      iconDark: form.iconDark,
    };

    const response: any = await $fetch("/api/admin/settings", {
      method: "PUT",
      body: payload,
    });

    if (response?.c === 200) {
      setMessage(t("admin.settings.actions.saveSuccess"), "success");
    } else {
      setMessage(response?.m || t("admin.settings.actions.saveFailed"));
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.settings.actions.saveFailed"));
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await loadSettings();
});
</script>
