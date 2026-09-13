<template>
  <div class="space-y-6">
    <!-- 提示信息 -->
    <div class="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
      <p class="text-sm text-blue-800 dark:text-blue-200">
        {{ $t("admin.settings.system.hint") }}
      </p>
    </div>

    <!-- 消息提示 -->
    <div v-if="message.text" class="p-3 rounded-lg text-sm" :class="message.type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
      ">
      {{ message.text }}
    </div>

    <!-- 配置表格 -->
    <div v-for="(configs, category) in configsByCategory" :key="category"
      class="bg-surface text-foreground border border-border rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-base font-semibold text-foreground">
          {{ $t(`admin.settings.system.categories.${category}`) }}
        </h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-surface-muted">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                {{ $t("admin.settings.system.table.key") }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                {{ $t("admin.settings.system.table.description") }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                {{ $t("admin.settings.system.table.value") }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider w-24">
                {{ $t("admin.settings.system.table.actions") }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="config in configs" :key="config.key" class="hover:bg-surface-muted transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <code class="text-sm font-mono text-foreground">
                    {{ config.key }}
                  </code>
                  <span v-if="config.isRequired" class="text-xs text-red-500" title="必填">
                    *
                  </span>
                  <span v-if="config.isEncrypted" class="text-xs text-muted" title="加密字段">
                    🔒
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-muted">
                  {{ config.description }}
                </div>
                <p v-if="config.key === 'GOOGLE_ADS_ID'" class="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  {{ $t("admin.settings.system.googleAdsIdHint") }}
                </p>
                <p v-if="config.key === 'GOOGLE_ADS_ARTICLE_ADS_SLOT'" class="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  {{ $t("admin.settings.system.googleAdsSlotHint") }}
                </p>
              </td>
              <td class="px-6 py-4">
                <div v-if="editingKey !== config.key" class="flex items-center gap-2">
                  <template v-if="isSwitchKey(config.key)">
                    <button
                      type="button"
                      role="switch"
                      :aria-checked="switchValue(config.value)"
                      :disabled="saving"
                      :class="[
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                        switchValue(config.value)
                          ? 'bg-primary-600'
                          : 'bg-surface-muted',
                      ]"
                      @click="handleSwitchToggle(config)"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition',
                          switchValue(config.value) ? 'translate-x-5' : 'translate-x-1',
                        ]"
                      />
                    </button>
                    <span class="text-sm text-muted">
                      {{ switchValue(config.value) ? $t("admin.settings.system.switchOn") : $t("admin.settings.system.switchOff") }}
                    </span>
                  </template>
                  <span v-else-if="!config.isEncrypted" class="text-sm text-foreground font-mono truncate max-w-md">
                    {{ config.value || "-" }}
                  </span>
                  <div v-else class="flex items-center gap-2">
                    <span class="text-sm font-mono text-foreground" :class="{
                      'blur-sm select-none': !visibleKeys[config.key],
                    }">
                      {{
                        visibleKeys[config.key]
                          ? config.value || "-"
                          : config.value
                            ? "•".repeat(Math.min(config.value.length, 20))
                            : "-"
                      }}
                    </span>
                    <button v-if="config.value" @click="toggleVisibility(config.key)"
                      class="text-muted hover:text-foreground transition-colors" type="button">
                      <EyeSlashIcon v-if="visibleKeys[config.key]" class="w-4 h-4" />
                      <EyeIcon v-else class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div v-else class="flex items-center gap-2">
                  <input :ref="(el) => {
                      if (el) inputRefs[config.key] = el as HTMLInputElement;
                    }
                    " v-model="editingValue" type="text"
                    class="flex-1 rounded-lg border border-primary-500 bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                    :placeholder="$t('admin.settings.system.placeholder', {
                      key: config.key,
                    })
                      " @keyup.enter="handleSave(config)" @keyup.esc="handleCancelEdit" />
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="editingKey !== config.key" class="flex items-center gap-2">
                  <button v-if="!isSwitchKey(config.key)" type="button" @click="handleEdit(config)"
                    class="text-primary-600 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors">
                    {{ $t("admin.settings.system.table.edit") }}
                  </button>
                </div>
                <div v-else class="flex items-center gap-2">
                  <button type="button" @click="handleSave(config)" :disabled="saving"
                    class="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium transition-colors disabled:opacity-50">
                    {{ $t("admin.settings.system.table.save") }}
                  </button>
                  <button type="button" @click="handleCancelEdit"
                    class="text-muted hover:text-foreground text-sm font-medium transition-colors">
                    {{ $t("admin.settings.system.table.cancel") }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="Object.keys(configsByCategory).length === 0" class="text-center py-12 text-muted">
      {{ $t("admin.settings.system.noConfigs") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/outline";

/** 使用开关 UI 的配置键（值为 true/false） */
const SWITCH_CONFIG_KEYS = [
  "GOOGLE_LOGIN_ENABLED",
  "GITHUB_LOGIN_ENABLED",
  "GOOGLE_ADS_ENABLED",
  "GOOGLE_ADS_ARTICLE_ADS_ENABLED",
];

const isSwitchKey = (key: string) => SWITCH_CONFIG_KEYS.includes(key);
const switchValue = (value: string | null) =>
  value !== null && value !== undefined && String(value).toLowerCase() !== "false";

const { t } = useI18n();
// 状态
const configs = ref<Record<string, string | null>>({});
const configsByCategory = ref<Record<string, any[]>>({});
const saving = ref(false);
const editingKey = ref<string | null>(null);
const editingValue = ref<string>("");
const inputRefs = ref<Record<string, HTMLInputElement>>({});
const message = ref<{ text: string; type: "success" | "error" | "" }>({
  text: "",
  type: "",
});
// 密钥显示/隐藏状态管理
const visibleKeys = ref<Record<string, boolean>>({});

// 设置消息
const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: "", type: "" };
  }, 3000);
};

// 切换密钥显示/隐藏
const toggleVisibility = (configKey: string) => {
  visibleKeys.value[configKey] = !visibleKeys.value[configKey];
};

// 加载系统配置
const loadConfigs = async () => {
  try {
    const response: any = await $fetch("/api/admin/system-config");
    if (response?.c === 200 && response.d) {
      const configsData: Record<string, string | null> = {};
      const configsByCategoryData = response.d.configsByCategory || {};

      // console.log(configsByCategoryData);
      // 从 configsByCategory 中提取配置值
      for (const category in configsByCategoryData) {
        for (const config of configsByCategoryData[category]) {
          configsData[config.key] = config.value;
        }
      }

      configs.value = configsData;
      configsByCategory.value = configsByCategoryData;
    }
  } catch (err: any) {
    console.error("加载系统配置失败:", err);
    setMessage(t("admin.settings.actions.loadFailed"), "error");
  }
};

// 开始编辑
const handleEdit = (config: any) => {
  editingKey.value = config.key;
  editingValue.value = config.value || "";

  // 聚焦输入框
  nextTick(() => {
    const input = inputRefs.value[config.key];
    if (input) {
      input.focus();
      input.select();
    }
  });
};

// 取消编辑
const handleCancelEdit = () => {
  editingKey.value = null;
  editingValue.value = "";
};

// 开关切换并保存
const handleSwitchToggle = async (config: any) => {
  const next = !switchValue(config.value);
  const value = next ? "true" : "false";
  saving.value = true;
  try {
    const response: any = await $fetch("/api/admin/system-config", {
      method: "PUT",
      body: { configs: { [config.key]: value } },
    });
    if (response?.c === 200) {
      setMessage(t("admin.settings.actions.saveSuccess"), "success");
      await loadConfigs();
    } else {
      setMessage(response?.m || t("admin.settings.actions.saveFailed"), "error");
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.settings.actions.saveFailed"), "error");
  } finally {
    saving.value = false;
  }
};

// 保存单个配置
const handleSave = async (config: any) => {
  if (editingKey.value !== config.key) return;

  const value = editingValue.value.trim() || null;

  // 验证必填字段
  if (config.isRequired && !value) {
    setMessage(`${config.description} 是必填项`, "error");
    return;
  }

  // 特殊验证：R2_SECRET_ID 必须是 32 字符
  if (config.key === "R2_SECRET_ID" && value && value.length !== 32) {
    setMessage("R2 Access Key ID 必须是 32 个字符", "error");
    return;
  }

  saving.value = true;
  try {
    const response: any = await $fetch("/api/admin/system-config", {
      method: "PUT",
      body: {
        configs: {
          [config.key]: value,
        },
      },
    });

    if (response?.c === 200) {
      setMessage(t("admin.settings.actions.saveSuccess"), "success");
      await loadConfigs();
      handleCancelEdit();
    } else {
      setMessage(
        response?.m || t("admin.settings.actions.saveFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.settings.actions.saveFailed"), "error");
  } finally {
    saving.value = false;
  }
};

// 重置
const handleReset = async () => {
  await loadConfigs();
  setMessage(t("admin.settings.actions.resetSuccess"), "success");
};

// 初始化
onMounted(() => {
  loadConfigs();
});
</script>
