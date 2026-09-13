<template>
  <div class="space-y-8">
    <!-- ========== 上部分：翻译设置（原 Settings 内容） ========== -->
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-foreground">
          {{ $t("admin.settings.translation.sectionSettings") }}
        </h3>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-end gap-3 border-border">
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

      <!-- 消息提示 -->
      <div v-if="message.text" class="p-3 rounded-lg text-sm" :class="message.type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        ">
        {{ message.text }}
      </div>

      <!-- 响应式：电脑端一行多列，移动端单列 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <!-- 默认语言 -->
        <div>
          <label class="block text-sm font-medium text-muted mb-2">
            {{ $t("admin.settings.language.defaultLang") }}
            <span class="text-red-500">*</span>
          </label>
          <AppSelect v-model="form.defaultLang" :options="languageOptions" required
            :placeholder="$t('admin.settings.language.selectPlaceholder')" />
        </div>

        <!-- 启用自动翻译（与默认语言同一行时占位对齐，单独一行时正常） -->
        <div class="flex flex-col justify-end">
          <label class="inline-flex items-center gap-2 text-sm font-medium text-muted cursor-pointer">
            <input v-model="form.autoTranslateEnabled" type="checkbox"
              class="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500" />
            {{ $t("admin.settings.translation.autoTranslateEnabled") }}
          </label>
          <p class="mt-1 text-xs text-muted">
            {{ $t("admin.settings.translation.autoTranslateHint") }}
          </p>
        </div>
      </div>

      <div v-if="form.autoTranslateEnabled" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label class="block text-sm font-medium text-muted mb-2">
            {{ $t("admin.settings.translation.primaryProvider") }}
          </label>
          <AppSelect v-model="form.primaryTranslationProvider" :options="aiProviderOptions"
            :placeholder="$t('admin.settings.language.selectPlaceholder')" />
          <p class="mt-1 text-xs text-muted">
            {{ $t("admin.settings.translation.primaryProviderHint") }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-muted mb-2">
            {{ $t("admin.settings.translation.fallbackProvider") }}
          </label>
          <AppSelect v-model="form.fallbackTranslationProvider" :options="machineProviderOptions"
            :placeholder="$t('admin.settings.language.selectPlaceholder')" />
          <p class="mt-1 text-xs text-muted">
            {{ $t("admin.settings.translation.fallbackProviderHint") }}
          </p>
        </div>
      </div>

      <div v-if="form.autoTranslateEnabled && availableAiProviders.length === 0"
        class="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          {{ $t("admin.settings.translation.noAiProvider") }}
        </p>
      </div>
      <div v-if="form.autoTranslateEnabled && availableMachineProviders.length === 0"
        class="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          {{ $t("admin.settings.translation.noMachineProvider") }}
        </p>
      </div>

    </section>
    <hr class="border-primary-500">
    <!-- ========== 下部分：翻译配置管理（原 translation.vue 内容） ========== -->
    <section class="bg-surface text-foreground">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t("admin.translation.title") }}
        </h2>
        <div class="flex items-center gap-3">
          <button type="button"
            class="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
            @click="loadTranslationConfigs" :disabled="listLoading">
            <span class="flex items-center gap-2">
              <ArrowPathIcon :class="['w-4 h-4', listLoading && 'animate-spin']" />
              {{ $t("common.refresh") }}
            </span>
          </button>
          <button @click="addTranslationConfig"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            {{ $t("admin.translation.actions.add") }}
          </button>
        </div>
      </div>

      <div class="overflow-x-auto max-h-[50vh] overflow-y-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted min-w-[100px]">
                {{ $t("admin.translation.table.name") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted min-w-[80px]">
                {{ $t("admin.translation.table.protocol") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted max-w-[200px]">
                {{ $t("admin.translation.table.apiKey") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted max-w-[200px]">
                {{ $t("admin.translation.table.apiSecret") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted max-w-[240px]">
                {{ $t("admin.translation.table.endpoint") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted min-w-[70px]">
                {{ $t("admin.translation.table.status") }}
              </th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-muted whitespace-nowrap min-w-[200px]">
                {{ $t("admin.translation.table.actions") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="listLoading" class="border-b border-border">
              <td colspan="7" class="py-12 text-center text-muted">
                <span class="inline-flex flex-col items-center gap-2">
                  <ArrowPathIcon class="w-8 h-8 animate-spin" />
                  <span class="text-sm">{{ $t("common.loading") }}</span>
                </span>
              </td>
            </tr>
            <tr v-else v-for="config in translationConfigs" :key="config.id"
              class="border-b border-border hover:bg-surface-muted">
              <td class="py-3 px-4 text-sm text-foreground">{{ config.name }}</td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ getProtocolLabel(config.provider) }}
              </td>
              <td class="py-3 px-4 max-w-[200px]">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-sm font-mono text-foreground truncate min-w-0" :class="{
                    'blur-sm select-none': !visibleKeys[config.id]?.apiKey,
                  }">
                    {{
                      visibleKeys[config.id]?.apiKey
                        ? config.apiKey || "-"
                        : config.apiKey
                          ? "•".repeat(Math.min(config.apiKey.length, 20))
                          : "-"
                    }}
                  </span>
                  <button v-if="config.apiKey" @click="toggleVisibility(config.id, 'apiKey')"
                    class="text-muted hover:text-foreground transition-colors shrink-0" type="button">
                    <EyeSlashIcon v-if="visibleKeys[config.id]?.apiKey" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td class="py-3 px-4 max-w-[200px]">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-sm font-mono text-foreground truncate min-w-0" :class="{
                    'blur-sm select-none': !visibleKeys[config.id]?.apiSecret,
                  }">
                    {{
                      visibleKeys[config.id]?.apiSecret
                        ? config.apiSecret || "-"
                        : config.apiSecret
                          ? "•".repeat(Math.min(config.apiSecret.length, 20))
                          : "-"
                    }}
                  </span>
                  <button v-if="config.apiSecret" @click="toggleVisibility(config.id, 'apiSecret')"
                    class="text-muted hover:text-foreground transition-colors shrink-0" type="button">
                    <EyeSlashIcon v-if="visibleKeys[config.id]?.apiSecret" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td class="py-3 px-4 text-sm text-foreground font-mono max-w-[240px] truncate"
                :title="config.apiEndpoint || ''">
                {{ config.apiEndpoint || "-" }}
              </td>
              <td class="py-3 px-4">
                <span :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  config.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-surface-muted text-muted',
                ]">
                  {{
                    config.isActive
                      ? $t("admin.translation.status.enabled")
                      : $t("admin.translation.status.disabled")
                  }}
                </span>
              </td>
              <td class="py-3 px-4 text-right whitespace-nowrap min-w-[200px]">
                <div class="flex justify-end gap-3">
                  <button @click="testConnection(config)" :disabled="testingConfigId === config.id"
                    class="px-3 py-1 text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1"
                    type="button" :title="$t('admin.translation.actions.test')">
                    <ArrowPathIcon v-if="testingConfigId === config.id" class="w-4 h-4 animate-spin" />
                    {{ $t("admin.translation.actions.test") }}
                  </button>
                  <button @click="copyTranslationConfig(config)"
                    class="px-3 py-1 text-sm text-muted hover:text-foreground transition-colors" type="button">
                    {{ $t("admin.translation.actions.copy") }}
                  </button>
                  <button @click="editTranslationConfig(config)"
                    class="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    type="button">
                    {{ $t("admin.translation.actions.edit") }}
                  </button>
                  <button @click="deleteTranslationConfig(config)"
                    class="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    type="button">
                    {{ $t("admin.translation.actions.delete") }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 翻译配置编辑模态框 -->
    <Teleport to="body">
      <div v-if="showTranslationModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-surface text-foreground rounded-2xl p-6 w-full max-w-md mx-4 border border-border" @click.stop>
          <h3 class="text-xl font-bold text-foreground mb-4">
            {{
              isEditing
                ? $t("admin.translation.modal.edit")
                : $t("admin.translation.modal.add")
            }}
          </h3>

          <form @submit.prevent="saveTranslationConfig" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.translation.modal.name") }}
              </label>
              <input v-model="translationForm.name" type="text"
                :placeholder="$t('admin.translation.modal.namePlaceholder')"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.translation.modal.provider") }}
              </label>
              <AppSelect v-model="translationForm.provider" :options="protocolOptions"
                :placeholder="$t('admin.translation.modal.providerPlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.translation.modal.apiKey") }}
              </label>
              <input v-model="translationForm.apiKey"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.translation.modal.apiKeyPlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.translation.modal.apiSecret") }}
              </label>
              <input v-model="translationForm.apiSecret"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.translation.modal.apiSecretPlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.translation.modal.apiEndpoint") }}
              </label>
              <input v-model="translationForm.apiEndpoint" type="text"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.translation.modal.apiEndpointPlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.translation.modal.extraConfig") }}
              </label>
              <textarea v-model="translationForm.extraConfig" rows="3"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground font-mono text-sm"
                :placeholder="$t('admin.translation.modal.extraConfigPlaceholder')"></textarea>
            </div>

            <div class="flex items-center gap-2">
              <input v-model="translationForm.isActive" type="checkbox" class="w-4 h-4 text-blue-600 rounded" />
              <span class="text-sm text-muted">{{
                $t("admin.translation.modal.enabled")
              }}</span>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="submit"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {{ $t("admin.translation.actions.save") }}
              </button>
              <button type="button" @click="showTranslationModal = false"
                class="flex-1 px-4 py-2 bg-surface-muted text-foreground rounded-lg hover:bg-surface-muted/70 transition-colors">
                {{ $t("admin.translation.actions.cancel") }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from "@heroicons/vue/24/outline";
import AppSelect from "~/components/app/Select.vue";

const { t } = useI18n();
const { showConfirm } = useConfirm();

interface ProviderConfig {
  id: string;
  name: string;
  provider: string;
  apiKey: string | null;
  apiSecret: string | null;
  apiEndpoint: string | null;
  timeout: number;
  maxRetries: number;
  priority: number;
  extraConfig: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------- 上部分：设置表单 ----------
const saving = ref(false);
const message = ref<{ text: string; type: "success" | "error" | "" }>({
  text: "",
  type: "",
});

const form = reactive({
  defaultLang: "zh",
  autoTranslateEnabled: false,
  primaryTranslationProvider: null as string | null,
  fallbackTranslationProvider: null as string | null,
});

const languages = ref<any[]>([]);

const languageOptions = computed(() => {
  return languages.value.map((lang) => ({
    value: lang.code,
    label: `${lang.nativeName || lang.name} (${lang.code})`,
  }));
});

const translationConfigs = ref<ProviderConfig[]>([]);
const aiConfigs = ref<ProviderConfig[]>([]);

const availableAiProviders = computed(() => {
  return aiConfigs.value.filter((p) => p.isActive);
});

const availableMachineProviders = computed(() => {
  return translationConfigs.value.filter((p) => p.isActive);
});

const aiProviderOptions = computed(() => {
  return availableAiProviders.value.map((provider) => ({
    value: provider.id,
    label: `${provider.name} (${getProtocolLabel(provider.provider)})`,
  }));
});

const machineProviderOptions = computed(() => {
  return availableMachineProviders.value.map((provider) => ({
    value: provider.id,
    label: `${provider.name} (${getProtocolLabel(provider.provider)})`,
  }));
});

const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: "", type: "" };
  }, 4000);
};

const loadSettings = async () => {
  try {
    const response: any = await $fetch("/api/admin/settings");
    if (response?.c === 200 && response.d) {
      form.defaultLang = response.d.defaultLang || "zh";
      form.autoTranslateEnabled = response.d.autoTranslateEnabled || false;
      form.primaryTranslationProvider =
        response.d.primaryTranslationProvider || null;
      form.fallbackTranslationProvider =
        response.d.fallbackTranslationProvider || null;
    }
  } catch (err: any) {
    console.error(t("admin.settings.actions.loadFailed"), err);
  }
};

const loadLanguages = async () => {
  try {
    const response: any = await $fetch("/api/languages");
    if (response?.c === 200) {
      const list = Array.isArray(response.d) ? response.d : response.d?.items || [];
      languages.value = list;
    }
  } catch (err: any) {
    console.error("加载语言列表失败:", err);
  }
};

const handleReset = async () => {
  await loadSettings();
  setMessage(t("admin.settings.actions.resetSuccess"), "success");
};

const handleSave = async () => {
  if (!form.defaultLang) {
    setMessage(t("admin.settings.actions.fillRequired"));
    return;
  }
  saving.value = true;
  try {
    const payload: any = {
      defaultLang: form.defaultLang,
      autoTranslateEnabled: form.autoTranslateEnabled,
      primaryTranslationProvider: form.primaryTranslationProvider,
      fallbackTranslationProvider: form.fallbackTranslationProvider,
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

// ---------- 下部分：翻译配置管理 ----------
const showTranslationModal = ref(false);
const editingTranslationConfig = ref<ProviderConfig | null>(null);
const isEditing = computed(() => !!editingTranslationConfig.value);
const listLoading = ref(false);
const testingConfigId = ref<string | null>(null);

const visibleKeys = ref<
  Record<string, { apiKey?: boolean; apiSecret?: boolean }>
>({});

const toggleVisibility = (configId: string, key: "apiKey" | "apiSecret") => {
  if (!visibleKeys.value[configId]) {
    visibleKeys.value[configId] = {};
  }
  visibleKeys.value[configId][key] = !visibleKeys.value[configId][key];
};

const protocolOptionKeys = [
  "deepl",
  "volcano",
  "google",
  "baidu",
  "tencent",
  "youdao",
] as const;

function getProtocolLabel(provider: string | null): string {
  if (!provider) return "-";
  const aiKey = `admin.ai.protocolOptions.${provider}`;
  const aiLabel = t(aiKey);
  if (aiLabel !== aiKey) return aiLabel;
  const key = `admin.translation.protocolOptions.${provider}`;
  const label = t(key);
  return label === key ? provider : label;
}

const protocolOptions = computed(() => {
  return protocolOptionKeys.map((value) => ({
    value,
    label: getProtocolLabel(value),
  }));
});

const translationForm = ref({
  name: "",
  provider: "",
  apiKey: "",
  apiSecret: "",
  apiEndpoint: "",
  timeout: 30000,
  maxRetries: 3,
  priority: 0,
  extraConfig: "",
  isActive: true,
});

const loadTranslationConfigs = async () => {
  listLoading.value = true;
  try {
    translationConfigs.value = await api.get<ProviderConfig[]>(
      "/api/admin/translations"
    );
  } catch (error: any) {
    console.error("加载翻译配置列表失败:", error);
    setMessage(
      error.message || t("admin.translation.messages.loadFailed"),
      "error"
    );
  } finally {
    listLoading.value = false;
  }
};

const loadAiConfigs = async () => {
  try {
    aiConfigs.value = await api.get<ProviderConfig[]>("/api/admin/ai-configs");
  } catch (error: any) {
    console.error("加载AI配置列表失败:", error);
  }
};

const addTranslationConfig = () => {
  editingTranslationConfig.value = null;
  translationForm.value = {
    name: "",
    provider: "",
    apiKey: "",
    apiSecret: "",
    apiEndpoint: "",
    timeout: 30000,
    maxRetries: 3,
    priority: 0,
    extraConfig: "",
    isActive: true,
  };
  showTranslationModal.value = true;
};

const editTranslationConfig = async (config: ProviderConfig) => {
  try {
    const fullConfig = await api.get<ProviderConfig>(
      `/api/admin/translations/${config.id}`
    );
    editingTranslationConfig.value = fullConfig;
    translationForm.value = {
      name: fullConfig.name,
      provider: fullConfig.provider,
      apiKey: fullConfig.apiKey || "",
      apiSecret: fullConfig.apiSecret || "",
      apiEndpoint: fullConfig.apiEndpoint || "",
      timeout: fullConfig.timeout,
      maxRetries: fullConfig.maxRetries,
      priority: fullConfig.priority,
      extraConfig: fullConfig.extraConfig || "",
      isActive: fullConfig.isActive,
    };
    showTranslationModal.value = true;
  } catch (error: any) {
    console.error("加载翻译配置失败:", error);
    setMessage(
      error.message || t("admin.translation.messages.loadConfigFailed"),
      "error"
    );
  }
};

const saveTranslationConfig = async () => {
  if (!translationForm.value.name?.trim()) {
    setMessage(t("admin.translation.messages.nameRequired"), "error");
    return;
  }
  if (!translationForm.value.provider?.trim()) {
    setMessage(t("admin.translation.messages.providerRequired"), "error");
    return;
  }
  try {
    if (isEditing.value && editingTranslationConfig.value) {
      await api.patch(
        `/api/admin/translations/${editingTranslationConfig.value.id}`,
        {
          name: translationForm.value.name.trim(),
          provider: translationForm.value.provider.trim(),
          apiKey: translationForm.value.apiKey || null,
          apiSecret: translationForm.value.apiSecret || null,
          apiEndpoint: translationForm.value.apiEndpoint || null,
          timeout: translationForm.value.timeout,
          maxRetries: translationForm.value.maxRetries,
          priority: translationForm.value.priority,
          extraConfig: translationForm.value.extraConfig || null,
          isActive: translationForm.value.isActive,
        }
      );
      setMessage(t("admin.translation.messages.updateSuccess"), "success");
    } else {
      await api.post("/api/admin/translations", {
        name: translationForm.value.name.trim(),
        provider: translationForm.value.provider.trim(),
        apiKey: translationForm.value.apiKey || null,
        apiSecret: translationForm.value.apiSecret || null,
        apiEndpoint: translationForm.value.apiEndpoint || null,
        timeout: translationForm.value.timeout,
        maxRetries: translationForm.value.maxRetries,
        priority: translationForm.value.priority,
        extraConfig: translationForm.value.extraConfig || null,
        isActive: translationForm.value.isActive,
      });
      setMessage(t("admin.translation.messages.createSuccess"), "success");
    }
    showTranslationModal.value = false;
    editingTranslationConfig.value = null;
    await loadTranslationConfigs();
  } catch (error: any) {
    console.error("保存翻译配置失败:", error);
    setMessage(
      error.message || t("admin.translation.messages.saveFailed"),
      "error"
    );
  }
};

const copyTranslationConfig = async (config: ProviderConfig) => {
  try {
    await api.post(`/api/admin/translations/${config.id}/copy`);
    setMessage(t("admin.translation.messages.copySuccess"), "success");
    await loadTranslationConfigs();
  } catch (error: any) {
    setMessage(
      error.message || t("admin.translation.messages.copyFailed"),
      "error"
    );
  }
};

const deleteTranslationConfig = async (config: ProviderConfig) => {
  const confirmed = await showConfirm({
    title: t("admin.translation.actions.delete"),
    message: t("admin.translation.messages.deleteConfirm", { name: config.name }),
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
  });
  if (!confirmed) return;
  try {
    await api.delete(`/api/admin/translations/${config.id}`);
    setMessage(t("admin.translation.messages.deleteSuccess"), "success");
    await loadTranslationConfigs();
  } catch (error: any) {
    setMessage(
      error.message || t("admin.translation.messages.deleteFailed"),
      "error"
    );
  }
};

const testConnection = async (config: ProviderConfig) => {
  testingConfigId.value = config.id;
  try {
    const d = await api.post<{ ok?: boolean; message?: string }>(
      `/api/admin/translations/${config.id}/test`
    );
    if (d?.ok !== false) {
      setMessage(
        d?.message || t("admin.translation.messages.testSuccess"),
        "success"
      );
    } else {
      setMessage(
        d?.message || t("admin.translation.messages.testFailed"),
        "error"
      );
    }
  } catch (error: any) {
    const msg =
      error?.data ?? error?.message ?? t("admin.translation.messages.testFailed");
    setMessage(msg, "error");
  } finally {
    testingConfigId.value = null;
  }
};

onMounted(async () => {
  await Promise.all([
    loadSettings(),
    loadLanguages(),
    loadTranslationConfigs(),
    loadAiConfigs(),
  ]);
});
</script>
