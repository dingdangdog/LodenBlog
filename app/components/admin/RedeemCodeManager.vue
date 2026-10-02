<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h2 class="text-lg font-semibold text-foreground">{{ title }}</h2>
    </div>
    <div class="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted/40 p-3 sm:flex-row sm:items-end">
      <div v-if="showDuration" class="w-full text-sm sm:w-40">
        <p class="mb-1 font-medium text-foreground">{{ $t("admin.columns.codes.duration") }}</p>
        <AppSelect v-model="durationDays" :options="durationOptions" :allow-clear="false" />
      </div>
      <label class="w-full text-sm sm:w-28">
        <span class="mb-1 block font-medium text-foreground">{{ $t("admin.columns.codes.count") }}</span>
        <input
          v-model.number="count"
          type="number"
          min="1"
          max="100"
          class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </label>
      <button
        type="button"
        class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        :disabled="pending"
        @click="generate"
      >
        {{ pending ? $t("admin.columns.actions.saving") : $t("admin.columns.actions.generate") }}
      </button>
    </div>
    <p v-if="notice" class="text-sm text-muted">{{ notice }}</p>
    <p v-if="codes.length === 0" class="py-8 text-center text-sm text-muted">{{ $t("admin.columns.codes.empty") }}</p>
    <ul v-else class="divide-y divide-border overflow-hidden rounded-xl border border-border">
      <li v-for="item in codes" :key="item.id" class="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="break-all font-mono text-sm text-foreground">{{ item.code }}</p>
          <p class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span
              class="rounded px-2 py-0.5 font-medium"
              :class="statusClass(item.status)"
            >
              {{ statusLabel(item.status) }}
            </span>
            <span v-if="item.durationDays">{{ $t("column.durationDays", { count: item.durationDays }) }}</span>
            <span v-if="item.usedByUser">{{ item.usedByUser.name || item.usedByUser.username }}</span>
          </p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted" @click="copy(item.code)">
            {{ $t("admin.columns.actions.copy") }}
          </button>
          <button
            v-if="item.status === 'UNUSED'"
            type="button"
            class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            @click="revoke(item.id)"
          >
            {{ $t("admin.columns.actions.revoke") }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  listUrl: string;
  createUrl: string;
  showDuration?: boolean;
}>();

const { t } = useI18n();
const durationDays = ref<number>(30);
const durationOptions = computed(() => [
  { value: 30, label: t("admin.columns.codes.days30") },
  { value: 90, label: t("admin.columns.codes.days90") },
  { value: 365, label: t("admin.columns.codes.days365") },
]);
const count = ref(1);
const pending = ref(false);
const notice = ref("");
const codes = ref<any[]>([]);

function statusLabel(status: string) {
  if (status === "USED") return t("admin.columns.codes.used");
  if (status === "REVOKED") return t("admin.columns.codes.revoked");
  return t("admin.columns.codes.unused");
}

function statusClass(status: string) {
  if (status === "USED") return "bg-surface-muted text-muted";
  if (status === "REVOKED") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300";
}

async function load() {
  const response = await $fetch<{ c: number; d?: { codes: any[] } }>(props.listUrl);
  codes.value = response?.c === 200 ? response.d?.codes || [] : [];
}

async function generate() {
  pending.value = true;
  notice.value = "";
  try {
    const response = await $fetch<{ c: number; m?: string }>(props.createUrl, {
      method: "POST",
      body: props.showDuration
        ? { durationDays: durationDays.value, count: count.value }
        : { count: count.value },
    });
    notice.value = response?.m || (response?.c === 200 ? t("admin.columns.messages.generated") : t("admin.columns.messages.failed"));
    if (response?.c === 200) await load();
  } finally {
    pending.value = false;
  }
}

async function revoke(codeId: string) {
  const response = await $fetch<{ c: number; m?: string }>(`${props.listUrl.replace(/\/$/, "")}/${codeId}`, {
    method: "PATCH",
  });
  notice.value = response?.m || "";
  if (response?.c === 200) await load();
}

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    notice.value = t("admin.columns.messages.copied");
  } catch {
    notice.value = t("admin.columns.messages.failed");
  }
}

watch(() => props.listUrl, load, { immediate: true });
</script>
