<template>
  <section class="space-y-3 rounded-xl border border-border bg-surface p-4">
    <h2 class="text-base font-semibold text-foreground">{{ title }}</h2>
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label v-if="showDuration" class="text-sm text-muted">
        {{ $t("admin.columns.codes.duration") }}
        <select v-model.number="durationDays" class="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground">
          <option :value="30">{{ $t("admin.columns.codes.days30") }}</option>
          <option :value="90">{{ $t("admin.columns.codes.days90") }}</option>
          <option :value="365">{{ $t("admin.columns.codes.days365") }}</option>
        </select>
      </label>
      <label class="text-sm text-muted">
        {{ $t("admin.columns.codes.count") }}
        <input v-model.number="count" type="number" min="1" max="100" class="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground" />
      </label>
      <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" :disabled="pending" @click="generate">
        {{ $t("admin.columns.actions.generate") }}
      </button>
    </div>
    <p v-if="notice" class="text-sm text-muted">{{ notice }}</p>
    <p v-if="codes.length === 0" class="text-sm text-muted">{{ $t("admin.columns.codes.empty") }}</p>
    <ul v-else class="divide-y divide-border">
      <li v-for="item in codes" :key="item.id" class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="font-mono text-sm text-foreground break-all">{{ item.code }}</p>
          <p class="text-xs text-muted">
            <span v-if="item.durationDays">{{ $t("column.durationDays", { count: item.durationDays }) }} · </span>
            {{ statusLabel(item.status) }}
            <span v-if="item.usedByUser"> · {{ item.usedByUser.name || item.usedByUser.username }}</span>
          </p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="rounded-lg border border-border px-3 py-1.5 text-xs" @click="copy(item.code)">
            {{ $t("admin.columns.actions.copy") }}
          </button>
          <button v-if="item.status === 'UNUSED'" type="button" class="rounded-lg border border-border px-3 py-1.5 text-xs" @click="revoke(item.id)">
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
const durationDays = ref(30);
const count = ref(1);
const pending = ref(false);
const notice = ref("");
const codes = ref<any[]>([]);

function statusLabel(status: string) {
  if (status === "USED") return t("admin.columns.codes.used");
  if (status === "REVOKED") return t("admin.columns.codes.revoked");
  return t("admin.columns.codes.unused");
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
