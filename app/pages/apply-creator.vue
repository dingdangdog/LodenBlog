<template>
  <div class="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-xl">
    <div class="bg-surface text-foreground rounded-2xl border border-border p-6">
      <h1 class="text-2xl font-bold text-foreground mb-2">
        {{ $t("applyCreator.title") }}
      </h1>
      <p class="text-muted text-sm mb-6">
        {{ $t("applyCreator.description") }}
      </p>

      <!-- 已是创作者 -->
      <div v-if="isCreator" class="py-6 text-center">
        <p class="text-muted mb-4">{{ $t("applyCreator.alreadyCreator") }}</p>
        <NuxtLink :to="localePath('/admin/creator')"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          {{ $t("header.user.dashboard") }}
        </NuxtLink>
      </div>

      <!-- 已有待审核申请 -->
      <div v-else-if="latest && latest.status === 'PENDING'" class="py-6">
        <div class="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
          <p class="font-medium mb-2">{{ $t("applyCreator.pendingTitle") }}</p>
          <p class="text-sm">{{ $t("applyCreator.pendingHint") }}</p>
          <p class="text-xs mt-2 text-muted">
            {{ $t("applyCreator.submittedAt") }}: {{ formatDate(latest.createdAt) }}
          </p>
        </div>
      </div>

      <!-- 已驳回：可再次申请 -->
      <div v-else-if="latest && latest.status === 'REJECTED'" class="mb-6">
        <div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 mb-4">
          <p class="font-medium mb-2">{{ $t("applyCreator.rejectedTitle") }}</p>
          <p v-if="latest.rejectReason" class="text-sm">{{ latest.rejectReason }}</p>
          <p class="text-xs mt-2 text-muted">
            {{ formatDate(latest.reviewedAt) }}
          </p>
        </div>
      </div>

      <!-- 申请表单（非创作者且无待审核时显示） -->
      <form v-if="!isCreator && (!latest || latest.status !== 'PENDING')"
        class="space-y-4"
        @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            {{ $t("applyCreator.penName") }} <span class="text-red-500">*</span>
          </label>
          <input v-model="form.penName"
            type="text"
            maxlength="100"
            :placeholder="$t('applyCreator.penNamePlaceholder')"
            class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            {{ $t("applyCreator.key") }} <span class="text-red-500">*</span>
          </label>
          <input v-model="form.key"
            type="text"
            maxlength="50"
            :placeholder="$t('applyCreator.keyPlaceholder')"
            class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <p class="text-xs text-muted mt-1">{{ $t("applyCreator.keyHint") }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            {{ $t("applyCreator.message") }}
          </label>
          <textarea v-model="form.message"
            rows="3"
            maxlength="500"
            :placeholder="$t('applyCreator.messagePlaceholder')"
            class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
        </div>
        <div v-if="message.text" class="p-3 rounded-lg text-sm" :class="messageClass">
          {{ message.text }}
        </div>
        <button type="submit"
          :disabled="submitLoading"
          class="w-full py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          <ArrowPathIcon v-if="submitLoading" class="w-4 h-4 animate-spin" />
          {{ $t("applyCreator.submit") }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  middleware: ["auth"],
});

import { api } from "~/utils/api";
import { ArrowPathIcon } from "@heroicons/vue/24/outline";
import { ROLE_LEVEL } from "~~/utils/role";
import { usePermission } from "~/composables/usePermission";

const localePath = useLocalePath();
const { t: $t } = useI18n();
const { isCreator } = usePermission();

const form = reactive({
  penName: "",
  key: "",
  message: "",
});

const submitLoading = ref(false);
const latest = ref<{
  id: string;
  status: string;
  createdAt: string;
  reviewedAt?: string | null;
  rejectReason?: string | null;
} | null>(null);

const message = reactive({
  text: "",
  type: "success" as "success" | "error",
});

const messageClass = computed(() =>
  message.type === "success"
    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
);

function setMessage(text: string, type: "success" | "error" = "error") {
  message.text = text;
  message.type = type;
  setTimeout(() => {
    message.text = "";
  }, 4000);
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

async function loadStatus() {
  try {
    const res = await api.get<{ latest: typeof latest.value; isCreator: boolean }>(
      "/api/entry/creator-application"
    );
    latest.value = res.latest ?? null;
  } catch {
    latest.value = null;
  }
}

async function submit() {
  const penName = form.penName.trim();
  const key = form.key.trim();
  if (!penName) {
    setMessage($t("applyCreator.validation.penNameRequired"), "error");
    return;
  }
  if (!key) {
    setMessage($t("applyCreator.validation.keyRequired"), "error");
    return;
  }
  if (!/^[a-zA-Z_]+$/.test(key)) {
    setMessage($t("applyCreator.validation.keyFormat"), "error");
    return;
  }

  submitLoading.value = true;
  try {
    await api.post("/api/entry/creator-application", {
      penName,
      key,
      message: form.message.trim() || undefined,
    });
    setMessage($t("applyCreator.submitSuccess"), "success");
    await loadStatus();
    form.penName = "";
    form.key = "";
    form.message = "";
  } catch (e: any) {
    setMessage(e?.message || $t("applyCreator.submitFailed"), "error");
  } finally {
    submitLoading.value = false;
  }
}

onMounted(() => {
  loadStatus();
});
</script>
