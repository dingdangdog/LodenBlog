<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <button @click="navigateTo(localePath('/admin/edittheme'))"
        class="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors">
        {{ $t("admin.themes.add") }}
      </button>
      <button @click="showImportModal = true"
        class="px-3 py-1.5 text-sm bg-surface border border-border text-foreground rounded-md hover:bg-surface-muted transition-colors">
        {{ $t("admin.themes.import") || "导入主题" }}
      </button>
      <button @click="showGenerateModal = true"
        class="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center gap-1.5">
        <SparklesIcon class="w-4 h-4" />
        {{ $t("admin.themes.generateWithAI") }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      <p class="mt-2 text-sm text-muted">
        {{ $t("admin.themes.loading") }}
      </p>
    </div>

    <!-- 消息提示 -->
    <div v-if="message.text && !loading" class="p-2 rounded-md text-sm" :class="messageClass">
      {{ message.text }}
    </div>

    <!-- 错误提示 -->
    <div v-if="error && !loading"
      class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-md text-sm">
      {{ error }}
    </div>

    <!-- 主题列表 -->
    <div v-if="!loading" class="space-y-4">
      <section v-for="group in themeGroups" :key="group.key">
        <h2 class="text-sm font-semibold text-foreground mb-2">
          {{ group.title }}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <article v-for="theme in group.themes" :key="theme.id"
            class="bg-surface text-foreground rounded-lg p-3 border border-border">
            <div class="mb-2">
              <h3 class="text-sm font-semibold text-foreground truncate" :title="theme.displayName">
                {{ theme.displayName }}
              </h3>
              <p class="text-xs text-muted truncate">
                {{ theme.name }}
              </p>
              <div class="mt-1.5 flex h-2.5 overflow-hidden rounded-sm border border-border">
                <div class="flex-1" :style="{ backgroundColor: getBackgroundPreview(theme) }" :title="'背景色'"></div>
                <div class="flex-1" :style="{ backgroundColor: getPrimaryPreview(theme) }" :title="'主色调'"></div>
                <div class="flex-1" :style="{ backgroundColor: getSecondaryPreview(theme) }" :title="'辅助色'"></div>
                <div class="flex-1" :style="{ backgroundColor: getAccentPreview(theme) }" :title="'强调色'"></div>
              </div>
            </div>

            <div class="flex items-center gap-1 mb-2">
              <span v-if="theme.isDefault"
                class="px-1.5 py-0.5 text-[11px] leading-4 bg-primary-100 dark:bg-primary-900 text-primary-700 rounded">
                {{ $t("admin.themes.badges.default") }}
              </span>
              <span v-if="theme.isActive"
                class="px-1.5 py-0.5 text-[11px] leading-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                {{ $t("admin.themes.badges.active") }}
              </span>
              <span v-else class="px-1.5 py-0.5 text-[11px] leading-4 bg-surface-muted text-muted rounded">
                {{ $t("admin.themes.badges.inactive") }}
              </span>
            </div>

            <div class="flex gap-1.5 flex-wrap">
              <button @click="navigateTo(`${localePath('/admin/edittheme')}?id=${theme.id}`)"
                class="flex-1 min-w-[3.5rem] px-2 py-1 text-xs bg-surface-muted text-foreground rounded hover:bg-surface-muted/70 transition-colors">
                {{ $t("admin.themes.actions.edit") }}
              </button>
              <button @click="exportThemeToClipboard(theme)"
                class="px-2 py-1 text-xs bg-surface-muted text-foreground rounded hover:bg-surface-muted/70 transition-colors inline-flex items-center gap-1"
                :title="$t('admin.themes.actions.export') || '导出复制'">
                <ClipboardDocumentIcon class="w-3.5 h-3.5" />
                {{ $t("admin.themes.actions.export") || "导出" }}
              </button>
              <button @click="openEnhanceModal(theme.id)"
                class="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 transition-colors inline-flex items-center gap-1"
                :title="$t('admin.themes.actions.enhance')">
                <SparklesIcon class="w-3.5 h-3.5" />
                {{ $t("admin.themes.actions.enhance") }}
              </button>
              <button v-if="!theme.isDefault" @click="setAsDefault(theme.id)"
                class="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors">
                {{ $t("admin.themes.actions.enable") }}
              </button>
              <button v-if="!theme.isDefault" @click="deleteTheme(theme.id)"
                class="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                {{ $t("admin.themes.actions.delete") }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <!-- 导入主题对话框 -->
      <div v-if="showImportModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-surface text-foreground rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 border border-border"
          @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("admin.themes.import") || "导入主题" }}
            </h3>
            <button type="button" @click="closeImportModal" class="text-muted hover:text-foreground transition-colors">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="importTheme" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.themes.importPasteLabel") || "粘贴主题文本" }}
                <span class="text-red-500">*</span>
              </label>
              <textarea v-model="importText" rows="6" required
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.themes.importPastePlaceholder') || '粘贴以 LODEN_THEME_v1: 开头的文本，或直接粘贴 JSON'"></textarea>
              <p class="mt-1 text-xs text-muted">
                {{ $t("admin.themes.importHint") || "可在另一个系统里点击“导出”复制后，直接粘贴到这里导入。" }}
              </p>
            </div>

            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2">
                <input v-model="importSetAsDefault" type="checkbox"
                  class="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500" />
                <span class="text-sm text-muted">
                  {{ $t("admin.themes.importSetAsDefault") || "导入后设为默认主题" }}
                </span>
              </label>
            </div>

            <div v-if="importError"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {{ importError }}
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="closeImportModal"
                class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
                {{ $t("common.cancel") }}
              </button>
              <button type="submit" :disabled="importing"
                class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowPathIcon v-if="importing" class="w-4 h-4 animate-spin" />
                <span v-else>{{ $t("common.import") || "导入" }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 确认删除对话框 -->
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click="showDeleteConfirm = false">
        <div class="bg-surface text-foreground rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-border"
          @click.stop>
          <h3 class="text-lg font-semibold text-foreground mb-4">
            {{ $t("admin.themes.messages.deleteConfirm") }}
          </h3>
          <div class="flex justify-end gap-2">
            <button type="button" @click="showDeleteConfirm = false"
              class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
              {{ $t("common.cancel") }}
            </button>
            <button type="button" @click="confirmDelete"
              class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium">
              {{ $t("common.delete") }}
            </button>
          </div>
        </div>
      </div>

      <!-- AI生成主题对话框 -->
      <div v-if="showGenerateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          class="bg-surface text-foreground rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-border"
          @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("admin.themes.generateWithAI") }}
            </h3>
            <button type="button" @click="showGenerateModal = false"
              class="text-muted hover:text-foreground transition-colors">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="generateTheme" class="space-y-4">
            <!-- 颜色描述 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.themes.colorDescription") }}
                <span class="text-red-500">*</span>
              </label>
              <textarea v-model="generateForm.colorDescription" rows="4" required
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.themes.colorDescriptionPlaceholder')"></textarea>
              <p class="mt-1 text-xs text-muted">
                {{ $t("admin.themes.colorDescriptionHint") }}
              </p>
            </div>

            <!-- 主题模式 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.themes.mode") }}
                <span class="text-red-500">*</span>
              </label>
              <AppSelect v-model="generateForm.mode" :options="themeModeOptions" :placeholder="$t('admin.themes.mode')"
                :allow-clear="false" />
            </div>

            <!-- 主题名称 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.themes.name") }}
                <span class="text-red-500">*</span>
              </label>
              <input v-model="generateForm.name" type="text" required pattern="[a-z0-9-]+"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.themes.namePlaceholder')" />
              <p class="mt-1 text-xs text-muted">
                {{ $t("admin.themes.nameHint") }}
              </p>
            </div>

            <!-- 显示名称 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.themes.displayName") }}
                <span class="text-red-500">*</span>
              </label>
              <input v-model="generateForm.displayName" type="text" required
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.themes.displayNamePlaceholder')" />
            </div>

            <!-- AI模型选择 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.themes.aiProvider") }}
              </label>
              <AppSelect v-model="generateForm.providerId" :options="translationProviderOptions"
                :placeholder="$t('admin.themes.useDefaultProvider')" />
              <p class="mt-1 text-xs text-muted">
                {{ $t("admin.themes.aiProviderHint") }}
              </p>
            </div>

            <!-- 其他选项 -->
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2">
                <input v-model="generateForm.isDefault" type="checkbox"
                  class="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500" />
                <span class="text-sm text-muted">
                  {{ $t("admin.themes.setAsDefault") }}
                </span>
              </label>
            </div>

            <!-- 错误提示 -->
            <div v-if="generateError"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {{ generateError }}
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end gap-2 pt-4">
              <button type="button" @click="showGenerateModal = false"
                class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
                {{ $t("common.cancel") }}
              </button>
              <button type="submit" :disabled="generating"
                class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowPathIcon v-if="generating" class="w-4 h-4 animate-spin" />
                <SparklesIcon v-else class="w-4 h-4" />
                {{
                  generating
                    ? $t("admin.themes.generating")
                    : $t("admin.themes.generate")
                }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- AI优化主题对话框 -->
      <div v-if="showEnhanceModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          class="bg-surface text-foreground rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-border"
          @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("admin.themes.enhanceWithAI") }}
            </h3>
            <button type="button" @click="showEnhanceModal = false"
              class="text-muted hover:text-foreground transition-colors">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="enhanceTheme" class="space-y-4">
            <!-- 优化描述 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.themes.enhancementDescription") }}
                <span class="text-red-500">*</span>
              </label>
              <textarea v-model="enhanceForm.enhancementDescription" rows="4" required
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.themes.enhancementDescriptionPlaceholder')"></textarea>
              <p class="mt-1 text-xs text-muted">
                {{ $t("admin.themes.enhancementDescriptionHint") }}
              </p>
            </div>

            <!-- AI模型选择 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.themes.aiProvider") }}
              </label>
              <AppSelect v-model="enhanceForm.providerId" :options="translationProviderOptions"
                :placeholder="$t('admin.themes.useDefaultProvider')" />
              <p class="mt-1 text-xs text-muted">
                {{ $t("admin.themes.aiProviderHint") }}
              </p>
            </div>

            <!-- 错误提示 -->
            <div v-if="enhanceError"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {{ enhanceError }}
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end gap-2 pt-4">
              <button type="button" @click="showEnhanceModal = false"
                class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
                {{ $t("common.cancel") }}
              </button>
              <button type="submit" :disabled="enhancing"
                class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowPathIcon v-if="enhancing" class="w-4 h-4 animate-spin" />
                <SparklesIcon v-else class="w-4 h-4" />
                {{
                  enhancing
                    ? $t("admin.themes.enhancing")
                    : $t("admin.themes.enhance")
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import type { ThemeColors, ThemeMode } from "~~/utils/theme-presets";
import { getDefaultColorsByMode } from "~~/utils/theme-presets";
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
} from "@heroicons/vue/24/outline";
import AppSelect from "~/components/app/Select.vue";
const { t } = useI18n();

const localePath = useLocalePath();

interface Theme {
  id: string;
  name: string;
  displayName: string;
  mode: ThemeMode;
  colors: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

const themes = ref<Theme[]>([]);
const loading = ref(true);
const error = ref("");

// 消息提示
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

// 删除确认对话框
const showDeleteConfirm = ref(false);
const themeToDelete = ref<string | null>(null);

// AI生成相关状态
const showGenerateModal = ref(false);
const generating = ref(false);
const generateError = ref("");
const aiProviders = ref<
  Array<{
    id: string;
    name: string;
    provider: string;
    isActive: boolean;
    priority: number;
  }>
>([]);

const generateForm = ref({
  colorDescription: "",
  mode: "light" as "light" | "dark",
  name: "",
  displayName: "",
  providerId: "",
  isDefault: false,
});

// AI优化相关状态
const showEnhanceModal = ref(false);
const enhancing = ref(false);
const enhanceError = ref("");
const enhanceForm = ref({
  themeId: "",
  enhancementDescription: "",
  providerId: "",
});

// 主题模式选项
const themeModeOptions = computed(() => [
  { value: "light", label: t("admin.themes.light") },
  { value: "dark", label: t("admin.themes.dark") },
]);

// 翻译服务商选项
const translationProviderOptions = computed(() => {
  return aiProviders.value.map((provider) => ({
    value: provider.id,
    label: `${provider.name} (${provider.provider})`,
  }));
});

const themeGroups = computed(() => [
  {
    key: "light",
    title: t("admin.themes.light"),
    themes: themes.value.filter((item) => item.mode === "light"),
  },
  {
    key: "dark",
    title: t("admin.themes.dark"),
    themes: themes.value.filter((item) => item.mode === "dark"),
  },
]);

const parseColors = (colorsJson: string, mode: ThemeMode): ThemeColors => {
  try {
    return JSON.parse(colorsJson);
  } catch {
    return getDefaultColorsByMode(mode);
  }
};

const getBackgroundPreview = (theme: Theme) => {
  const colors = parseColors(theme.colors, theme.mode);
  return colors.background || (theme.mode === "dark" ? "#1F2937" : "#FFFFFF");
};

const getPrimaryPreview = (theme: Theme) => {
  const colors = parseColors(theme.colors, theme.mode);
  if (typeof colors.primary === "string") {
    return colors.primary;
  }
  return colors.primary?.["500"] || "#3B82F6";
};

const getSecondaryPreview = (theme: Theme) => {
  const colors = parseColors(theme.colors, theme.mode);
  if (typeof colors.secondary === "string") {
    return colors.secondary;
  }
  return colors.secondary?.["500"] || "#64748B";
};

const getAccentPreview = (theme: Theme) => {
  const colors = parseColors(theme.colors, theme.mode);
  if (typeof colors.accent === "string") {
    return colors.accent;
  }
  return colors.accent?.["500"] || "#6366F1";
};

const loadThemes = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response: any = await $fetch("/api/themes");
    if (response?.c === 200) {
      themes.value = Array.isArray(response.d)
        ? response.d
        : response.d?.items || [];
    } else {
      error.value = response?.m || t("admin.themes.messages.loadFailed");
    }
  } catch (err: any) {
    error.value =
      err?.data?.m || err?.message || t("admin.themes.messages.loadFailed");
  } finally {
    loading.value = false;
  }
};

// 主题导入导出
const THEME_EXPORT_PREFIX = "LODEN_THEME_v1:";

const showImportModal = ref(false);
const importing = ref(false);
const importText = ref("");
const importError = ref("");
const importSetAsDefault = ref(false);

const closeImportModal = () => {
  showImportModal.value = false;
  importing.value = false;
  importText.value = "";
  importError.value = "";
  importSetAsDefault.value = false;
};

const encodeBase64Url = (input: string) => {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const decodeBase64Url = (input: string) => {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (b64.length % 4)) % 4;
  const padded = b64 + "=".repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

const writeToClipboard = async (text: string) => {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "true");
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.left = "0";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.focus();
  el.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(el);
  if (!ok) {
    throw new Error("copy_failed");
  }
};

const exportThemeToClipboard = async (theme: Theme) => {
  try {
    const exportPayload = {
      v: 1,
      name: theme.name,
      displayName: theme.displayName,
      mode: theme.mode,
      colors: parseColors(theme.colors, theme.mode),
    };
    const encoded = encodeBase64Url(JSON.stringify(exportPayload));
    const text = `${THEME_EXPORT_PREFIX}${encoded}`;
    await writeToClipboard(text);
    setMessage(t("admin.themes.messages.exportCopied") || "已复制到剪贴板", "success");
  } catch (err: any) {
    setMessage(
      (t("admin.themes.messages.exportFailed") || "导出失败") +
      ": " +
      (err?.message || t("common.unknownError")),
      "error",
    );
  }
};

const parseImportPayload = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("empty");
  }
  let jsonText = trimmed;
  if (trimmed.startsWith(THEME_EXPORT_PREFIX)) {
    const token = trimmed.slice(THEME_EXPORT_PREFIX.length).trim();
    jsonText = decodeBase64Url(token);
  }
  const obj = JSON.parse(jsonText);
  if (!obj || typeof obj !== "object") {
    throw new Error("invalid");
  }
  const name = String((obj as any).name || "").trim();
  const displayName = String((obj as any).displayName || "").trim();
  const mode = (obj as any).mode as ThemeMode;
  const colors = (obj as any).colors as ThemeColors;

  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    throw new Error("invalid_name");
  }
  if (!displayName) {
    throw new Error("invalid_displayName");
  }
  if (mode !== "light" && mode !== "dark") {
    throw new Error("invalid_mode");
  }
  if (!colors || typeof colors !== "object") {
    throw new Error("invalid_colors");
  }
  return { name, displayName, mode, colors };
};

const importTheme = async () => {
  importError.value = "";
  importing.value = true;
  try {
    const payload = parseImportPayload(importText.value);
    const response: any = await $fetch("/api/admin/themes", {
      method: "POST",
      body: {
        name: payload.name,
        displayName: payload.displayName,
        mode: payload.mode,
        colors: payload.colors,
        isDefault: !!importSetAsDefault.value,
        sortOrder: 0,
      },
    });
    if (response?.c === 200) {
      setMessage(t("admin.themes.messages.importSuccess") || "导入成功", "success");
      closeImportModal();
      await loadThemes();
      return;
    }
    importError.value = response?.m || (t("admin.themes.messages.importFailed") || "导入失败");
  } catch (err: any) {
    importError.value =
      err?.data?.m ||
      err?.message ||
      (t("admin.themes.messages.importFailed") || "导入失败");
  } finally {
    importing.value = false;
  }
};

const setAsDefault = async (id: string) => {
  try {
    const response: any = await $fetch(`/api/admin/themes/${id}`, {
      method: "PATCH",
      body: {
        isDefault: true,
      },
    });

    if (response?.c === 200) {
      setMessage(t("admin.themes.messages.setDefaultSuccess"), "success");
      loadThemes();
    } else {
      setMessage(
        response?.m || t("admin.themes.messages.setDefaultFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      t("admin.themes.messages.setDefaultFailed") +
      ": " +
      (err?.data?.m || err?.message || t("common.unknownError")),
      "error"
    );
  }
};

const deleteTheme = (id: string) => {
  themeToDelete.value = id;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!themeToDelete.value) {
    showDeleteConfirm.value = false;
    return;
  }

  const id = themeToDelete.value;
  showDeleteConfirm.value = false;
  themeToDelete.value = null;

  try {
    const response: any = await $fetch(`/api/admin/themes/${id}`, {
      method: "DELETE",
    });

    if (response?.c === 200) {
      setMessage(t("admin.themes.messages.deleteSuccess"), "success");
      loadThemes();
    } else {
      setMessage(
        response?.m || t("admin.themes.messages.deleteFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      t("admin.themes.messages.deleteFailed") +
      ": " +
      (err?.data?.m || err?.message || t("common.unknownError")),
      "error"
    );
  }
};

const loadAiProviders = async () => {
  try {
    const response: any = await $fetch("/api/creator/ai-configs");
    if (response?.c === 200) {
      aiProviders.value = (response.d || [])
        .filter((p: any) => p.isActive)
        .sort((a: any, b: any) => b.priority - a.priority);
    }
  } catch (error) {
    console.error("加载AI服务商列表失败:", error);
  }
};

const generateTheme = async () => {
  if (!generateForm.value.colorDescription.trim()) {
    generateError.value = t("admin.themes.messages.colorDescriptionRequired");
    return;
  }

  if (!generateForm.value.name.trim()) {
    generateError.value = t("admin.themes.messages.nameRequired");
    return;
  }

  if (!generateForm.value.displayName.trim()) {
    generateError.value = t("admin.themes.messages.displayNameRequired");
    return;
  }

  generating.value = true;
  generateError.value = "";

  try {
    const body: any = {
      colorDescription: generateForm.value.colorDescription,
      mode: generateForm.value.mode,
      name: generateForm.value.name,
      displayName: generateForm.value.displayName,
      isDefault: generateForm.value.isDefault,
    };

    if (generateForm.value.providerId) {
      body.providerId = generateForm.value.providerId;
    }

    const response: any = await $fetch("/api/admin/themes/generate", {
      method: "POST",
      body,
    });

    if (response?.c === 200) {
      setMessage(t("admin.themes.messages.generateSuccess"), "success");
      showGenerateModal.value = false;
      generateForm.value = {
        colorDescription: "",
        mode: "light",
        name: "",
        displayName: "",
        providerId: "",
        isDefault: false,
      };
      await loadThemes();
    } else {
      generateError.value =
        response?.m || t("admin.themes.messages.generateFailed");
    }
  } catch (err: any) {
    console.error("生成主题失败:", err);
    generateError.value =
      err?.data?.m ||
      err?.message ||
      t("admin.themes.messages.generateFailed");
  } finally {
    generating.value = false;
  }
};

const openEnhanceModal = (themeId: string) => {
  enhanceForm.value = {
    themeId,
    enhancementDescription: "",
    providerId: "",
  };
  enhanceError.value = "";
  showEnhanceModal.value = true;
};

const enhanceTheme = async () => {
  if (!enhanceForm.value.enhancementDescription.trim()) {
    enhanceError.value = t("admin.themes.messages.enhancementDescriptionRequired");
    return;
  }

  enhancing.value = true;
  enhanceError.value = "";

  try {
    const body: any = {
      themeId: enhanceForm.value.themeId,
      enhancementDescription: enhanceForm.value.enhancementDescription,
    };

    if (enhanceForm.value.providerId) {
      body.providerId = enhanceForm.value.providerId;
    }

    const response: any = await $fetch("/api/admin/themes/enhance", {
      method: "POST",
      body,
    });

    if (response?.c === 200) {
      setMessage(t("admin.themes.messages.enhanceSuccess"), "success");
      showEnhanceModal.value = false;
      enhanceForm.value = {
        themeId: "",
        enhancementDescription: "",
        providerId: "",
      };
      await loadThemes();
    } else {
      enhanceError.value =
        response?.m || t("admin.themes.messages.enhanceFailed");
    }
  } catch (err: any) {
    console.error("优化主题失败:", err);
    enhanceError.value =
      err?.data?.m ||
      err?.message ||
      t("admin.themes.enhanceFailed");
  } finally {
    enhancing.value = false;
  }
};

onMounted(() => {
  loadThemes();
  loadAiProviders();
});
</script>
