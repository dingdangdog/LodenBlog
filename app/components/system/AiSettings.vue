<template>
  <div class="space-y-8">
    <section class="bg-surface text-foreground">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t("admin.ai.title") }}
        </h2>
        <div class="flex items-center gap-3">
          <button type="button"
            class="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
            @click="loadAiConfigs" :disabled="listLoading">
            <span class="flex items-center gap-2">
              <ArrowPathIcon :class="['w-4 h-4', listLoading && 'animate-spin']" />
              {{ $t("common.refresh") }}
            </span>
          </button>
          <button @click="addAiConfig"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            {{ $t("admin.ai.actions.add") }}
          </button>
        </div>
      </div>

      <div v-if="message.text" class="mb-4 p-3 rounded-lg text-sm" :class="message.type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        ">
        {{ message.text }}
      </div>

      <div class="overflow-x-auto max-h-[50vh] overflow-y-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted min-w-[100px]">
                {{ $t("admin.ai.table.name") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted min-w-[80px]">
                {{ $t("admin.ai.table.protocol") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted max-w-[200px]">
                {{ $t("admin.ai.table.apiKey") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted max-w-[200px]">
                {{ $t("admin.ai.table.apiSecret") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted max-w-[240px]">
                {{ $t("admin.ai.table.endpoint") }}
              </th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted min-w-[70px]">
                {{ $t("admin.ai.table.status") }}
              </th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-muted whitespace-nowrap min-w-[200px]">
                {{ $t("admin.ai.table.actions") }}
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
            <tr v-else v-for="config in aiConfigs" :key="config.id"
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
                      ? $t("admin.ai.status.enabled")
                      : $t("admin.ai.status.disabled")
                  }}
                </span>
              </td>
              <td class="py-3 px-4 text-right whitespace-nowrap min-w-[200px]">
                <div class="flex justify-end gap-3">
                  <button @click="testConnection(config)" :disabled="testingConfigId === config.id"
                    class="px-3 py-1 text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1"
                    type="button" :title="$t('admin.ai.actions.test')">
                    <ArrowPathIcon v-if="testingConfigId === config.id" class="w-4 h-4 animate-spin" />
                    {{ $t("admin.ai.actions.test") }}
                  </button>
                  <button @click="copyAiConfig(config)"
                    class="px-3 py-1 text-sm text-muted hover:text-foreground transition-colors" type="button">
                    {{ $t("admin.ai.actions.copy") }}
                  </button>
                  <button @click="editAiConfig(config)"
                    class="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    type="button">
                    {{ $t("admin.ai.actions.edit") }}
                  </button>
                  <button @click="deleteAiConfig(config)"
                    class="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    type="button">
                    {{ $t("admin.ai.actions.delete") }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-surface text-foreground rounded-2xl p-6 w-full max-w-md mx-4 border border-border" @click.stop>
          <h3 class="text-xl font-bold text-foreground mb-4">
            {{
              isEditing
                ? $t("admin.ai.modal.edit")
                : $t("admin.ai.modal.add")
            }}
          </h3>

          <form @submit.prevent="saveAiConfig" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.ai.modal.name") }}
              </label>
              <input v-model="aiForm.name" type="text" :placeholder="$t('admin.ai.modal.namePlaceholder')"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.ai.modal.provider") }}
              </label>
              <AppSelect v-model="aiForm.provider" :options="protocolOptions"
                :placeholder="$t('admin.ai.modal.providerPlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.ai.modal.apiKey") }}
              </label>
              <input v-model="aiForm.apiKey"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.ai.modal.apiKeyPlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.ai.modal.apiSecret") }}
              </label>
              <input v-model="aiForm.apiSecret"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.ai.modal.apiSecretPlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.ai.modal.apiEndpoint") }}
              </label>
              <input v-model="aiForm.apiEndpoint" type="text"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.ai.modal.apiEndpointPlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.ai.modal.extraConfig") }}
              </label>
              <textarea v-model="aiForm.extraConfig" rows="3"
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground font-mono text-sm"
                :placeholder="$t('admin.ai.modal.extraConfigPlaceholder')"></textarea>
            </div>

            <div class="flex items-center gap-2">
              <input v-model="aiForm.isActive" type="checkbox" class="w-4 h-4 text-blue-600 rounded" />
              <span class="text-sm text-muted">{{ $t("admin.ai.modal.enabled") }}</span>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="submit"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {{ $t("admin.ai.actions.save") }}
              </button>
              <button type="button" @click="showModal = false"
                class="flex-1 px-4 py-2 bg-surface-muted text-foreground rounded-lg hover:bg-surface-muted/70 transition-colors">
                {{ $t("admin.ai.actions.cancel") }}
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

interface AiConfigItem {
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

const message = ref<{ text: string; type: "success" | "error" | "" }>({
  text: "",
  type: "",
});

const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: "", type: "" };
  }, 4000);
};

const aiConfigs = ref<AiConfigItem[]>([]);
const showModal = ref(false);
const editingAiConfig = ref<AiConfigItem | null>(null);
const isEditing = computed(() => !!editingAiConfig.value);
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

const protocolOptionKeys = ["openai", "gemini", "alibaba", "deepseek"] as const;

function getProtocolLabel(provider: string | null): string {
  if (!provider) return "-";
  const key = `admin.ai.protocolOptions.${provider}`;
  const label = t(key);
  return label === key ? provider : label;
}

const protocolOptions = computed(() => {
  return protocolOptionKeys.map((value) => ({
    value,
    label: getProtocolLabel(value),
  }));
});

const aiForm = ref({
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

const loadAiConfigs = async () => {
  listLoading.value = true;
  try {
    aiConfigs.value = await api.get<AiConfigItem[]>("/api/admin/ai-configs");
  } catch (error: any) {
    console.error("加载AI配置列表失败:", error);
    setMessage(error.message || t("admin.ai.messages.loadFailed"), "error");
  } finally {
    listLoading.value = false;
  }
};

const addAiConfig = () => {
  editingAiConfig.value = null;
  aiForm.value = {
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
  showModal.value = true;
};

const editAiConfig = async (config: AiConfigItem) => {
  try {
    const fullConfig = await api.get<AiConfigItem>(
      `/api/admin/ai-configs/${config.id}`
    );
    editingAiConfig.value = fullConfig;
    aiForm.value = {
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
    showModal.value = true;
  } catch (error: any) {
    console.error("加载AI配置失败:", error);
    setMessage(
      error.message || t("admin.ai.messages.loadConfigFailed"),
      "error"
    );
  }
};

const saveAiConfig = async () => {
  if (!aiForm.value.name?.trim()) {
    setMessage(t("admin.ai.messages.nameRequired"), "error");
    return;
  }
  if (!aiForm.value.provider?.trim()) {
    setMessage(t("admin.ai.messages.providerRequired"), "error");
    return;
  }
  try {
    if (isEditing.value && editingAiConfig.value) {
      await api.patch(`/api/admin/ai-configs/${editingAiConfig.value.id}`, {
        name: aiForm.value.name.trim(),
        provider: aiForm.value.provider.trim(),
        apiKey: aiForm.value.apiKey || null,
        apiSecret: aiForm.value.apiSecret || null,
        apiEndpoint: aiForm.value.apiEndpoint || null,
        timeout: aiForm.value.timeout,
        maxRetries: aiForm.value.maxRetries,
        priority: aiForm.value.priority,
        extraConfig: aiForm.value.extraConfig || null,
        isActive: aiForm.value.isActive,
      });
      setMessage(t("admin.ai.messages.updateSuccess"), "success");
    } else {
      await api.post("/api/admin/ai-configs", {
        name: aiForm.value.name.trim(),
        provider: aiForm.value.provider.trim(),
        apiKey: aiForm.value.apiKey || null,
        apiSecret: aiForm.value.apiSecret || null,
        apiEndpoint: aiForm.value.apiEndpoint || null,
        timeout: aiForm.value.timeout,
        maxRetries: aiForm.value.maxRetries,
        priority: aiForm.value.priority,
        extraConfig: aiForm.value.extraConfig || null,
        isActive: aiForm.value.isActive,
      });
      setMessage(t("admin.ai.messages.createSuccess"), "success");
    }
    showModal.value = false;
    editingAiConfig.value = null;
    await loadAiConfigs();
  } catch (error: any) {
    console.error("保存AI配置失败:", error);
    setMessage(error.message || t("admin.ai.messages.saveFailed"), "error");
  }
};

const copyAiConfig = async (config: AiConfigItem) => {
  try {
    await api.post(`/api/admin/ai-configs/${config.id}/copy`);
    setMessage(t("admin.ai.messages.copySuccess"), "success");
    await loadAiConfigs();
  } catch (error: any) {
    setMessage(error.message || t("admin.ai.messages.copyFailed"), "error");
  }
};

const deleteAiConfig = async (config: AiConfigItem) => {
  const confirmed = await showConfirm({
    title: t("admin.ai.actions.delete"),
    message: t("admin.ai.messages.deleteConfirm", { name: config.name }),
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
  });
  if (!confirmed) return;
  try {
    await api.delete(`/api/admin/ai-configs/${config.id}`);
    setMessage(t("admin.ai.messages.deleteSuccess"), "success");
    await loadAiConfigs();
  } catch (error: any) {
    setMessage(error.message || t("admin.ai.messages.deleteFailed"), "error");
  }
};

const testConnection = async (config: AiConfigItem) => {
  testingConfigId.value = config.id;
  try {
    const d = await api.post<{ ok?: boolean; message?: string }>(
      `/api/admin/ai-configs/${config.id}/test`
    );
    if (d?.ok !== false) {
      setMessage(d?.message || t("admin.ai.messages.testSuccess"), "success");
    } else {
      setMessage(d?.message || t("admin.ai.messages.testFailed"), "error");
    }
  } catch (error: any) {
    const msg = error?.data ?? error?.message ?? t("admin.ai.messages.testFailed");
    setMessage(msg, "error");
  } finally {
    testingConfigId.value = null;
  }
};

onMounted(async () => {
  await loadAiConfigs();
});
</script>
