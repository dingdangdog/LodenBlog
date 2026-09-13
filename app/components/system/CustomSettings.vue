<template>
  <div class="space-y-6">
    <!-- 消息提示 -->
    <div
      v-if="message.text"
      class="p-3 rounded-lg text-sm"
      :class="
        message.type === 'success'
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
      "
    >
      {{ message.text }}
    </div>

    <div>
      <label
        class="block text-sm font-medium text-muted mb-2"
      >
        {{ $t("admin.settings.custom.headTitle") }}
      </label>
      <textarea
        v-model="form.customHead"
        rows="6"
        class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-mono text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
        :placeholder="$t('admin.settings.custom.headPlaceholder')"
      ></textarea>
      <p class="mt-1 text-xs text-muted">
        {{ $t("admin.settings.custom.headHint") }}
      </p>
    </div>

    <div>
      <label
        class="block text-sm font-medium text-muted mb-2"
      >
        {{ $t("admin.settings.custom.cssTitle") }}
      </label>
      <textarea
        v-model="form.customCSS"
        rows="8"
        class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-mono text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
        :placeholder="$t('admin.settings.custom.cssPlaceholder')"
      ></textarea>
      <p class="mt-1 text-xs text-muted">
        {{ $t("admin.settings.custom.cssHint") }}
      </p>
    </div>

    <div>
      <label
        class="block text-sm font-medium text-muted mb-2"
      >
        {{ $t("admin.settings.custom.jsTitle") }}
      </label>
      <textarea
        v-model="form.customJS"
        rows="8"
        class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-mono text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
        :placeholder="$t('admin.settings.custom.jsPlaceholder')"
      ></textarea>
      <p class="mt-1 text-xs text-muted">
        {{ $t("admin.settings.custom.jsHint") }}
      </p>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
      <button
        type="button"
        @click="handleReset"
        class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
      >
        {{ $t("admin.settings.actions.reset") }}
      </button>
      <button
        type="button"
        @click="handleSave"
        :disabled="saving"
        class="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
      >
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
import { ArrowPathIcon } from "@heroicons/vue/24/outline";

const { t } = useI18n();

const saving = ref(false);
const message = ref<{ text: string; type: "success" | "error" | "" }>({
  text: "",
  type: "",
});

const form = reactive({
  customHead: null as string | null,
  customCSS: null as string | null,
  customJS: null as string | null,
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
      form.customHead = response.d.customHead || null;
      form.customCSS = response.d.customCSS || null;
      form.customJS = response.d.customJS || null;
    }
  } catch (err: any) {
    console.error(t("admin.settings.actions.loadFailed"), err);
  }
};

// 重置表单
const handleReset = async () => {
  await loadSettings();
  setMessage(t("admin.settings.actions.resetSuccess"), "success");
};

// 保存表单
const handleSave = async () => {
  saving.value = true;

  try {
    const payload: any = {
      customHead: form.customHead,
      customCSS: form.customCSS,
      customJS: form.customJS,
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
