<template>
  <div class="overflow-hidden rounded-2xl border border-border bg-surface">
    <div class="border-b border-border px-4 py-3 sm:px-5">
      <h1 class="text-base font-semibold text-foreground sm:text-lg">{{ $t("admin.columns.records.title") }}</h1>
      <p class="mt-1 text-sm text-muted">{{ $t("admin.columns.records.readonly") }}</p>
    </div>

    <div class="overflow-x-auto border-b border-border">
      <nav class="flex h-11 min-w-0">
        <button
          v-for="item in tabs"
          :key="item.id"
          type="button"
          class="box-border flex h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-5"
          :class="tab === item.id
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-muted hover:border-border hover:text-foreground'"
          @click="tab = item.id"
        >
          {{ item.label }}
        </button>
      </nav>
    </div>

    <div v-if="tab === 'subscriptions'" class="border-b border-border px-4 py-3 sm:w-56">
      <AppSelect v-model="status" :options="statusOptions" :allow-clear="false" @change="loadSubscriptions" />
    </div>

    <div v-if="pending" class="p-8 text-center text-sm text-muted">
      <ArrowPathIcon class="mx-auto mb-2 h-6 w-6 animate-spin" />
      <p>{{ $t("common.loading") }}</p>
    </div>
    <p v-else-if="empty" class="p-8 text-center text-sm text-muted">{{ $t("common.noData") }}</p>

    <ul v-else-if="tab === 'columns'" class="divide-y divide-border">
      <li v-for="item in columns" :key="item.id" class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5">
        <div class="min-w-0">
          <p class="font-medium text-foreground">{{ item.title || item.id }}</p>
          <p class="mt-0.5 text-xs text-muted">{{ item.author?.name || item.author?.username }}<span v-if="item.slug"> · /column/{{ item.slug }}</span></p>
        </div>
        <span
          class="rounded px-2 py-0.5 text-xs font-medium"
          :class="item.isPublished
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'"
        >
          {{ item.isPublished ? $t("admin.columns.published") : $t("admin.columns.draft") }}
        </span>
      </li>
    </ul>

    <div v-else-if="tab === 'subscriptions'" class="divide-y divide-border">
      <article v-for="item in subscriptions" :key="item.id" class="px-4 py-3 text-sm sm:px-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="font-medium text-foreground">{{ item.columnTitle }} · {{ item.user?.name || item.user?.username }}</p>
          <span
            class="rounded px-2 py-0.5 text-xs font-medium"
            :class="item.active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-surface-muted text-muted'"
          >
            {{ item.active ? $t("column.active") : $t("column.expired") }}
          </span>
        </div>
        <p class="mt-1 text-xs text-muted">{{ formatDate(item.startsAt) }} – {{ formatDate(item.expiresAt) }}</p>
        <ul v-if="item.logs?.length" class="mt-2 space-y-1 text-xs text-muted">
          <li v-for="log in item.logs" :key="log.id">
            {{ $t("column.durationDays", { count: log.durationDays }) }} · {{ formatDate(log.appliedFrom) }} – {{ formatDate(log.appliedTo) }}
          </li>
        </ul>
      </article>
    </div>

    <ul v-else class="divide-y divide-border">
      <li v-for="item in codes" :key="item.id" class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
        <p class="break-all font-mono text-sm text-foreground">{{ item.code }}</p>
        <p class="text-xs text-muted">
          {{ statusLabel(item.status) }}
          <span v-if="item.durationDays"> · {{ $t("column.durationDays", { count: item.durationDays }) }}</span>
        </p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon } from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "admin"],
});

const { t, locale } = useI18n();
const tab = ref("columns");
const status = ref("all");
const pending = ref(true);
const statusOptions = computed(() => [
  { value: "all", label: t("admin.columns.subscriptions.all") },
  { value: "active", label: t("column.active") },
  { value: "expired", label: t("column.expired") },
]);
const columns = ref<any[]>([]);
const subscriptions = ref<any[]>([]);
const codes = ref<any[]>([]);
const tabs = computed(() => [
  { id: "columns", label: t("admin.columns.records.columns") },
  { id: "subscriptions", label: t("admin.columns.records.subscriptions") },
  { id: "columnCodes", label: t("admin.columns.records.columnCodes") },
  { id: "articleCodes", label: t("admin.columns.records.articleCodes") },
]);
const empty = computed(() => {
  if (tab.value === "columns") return columns.value.length === 0;
  if (tab.value === "subscriptions") return subscriptions.value.length === 0;
  return codes.value.length === 0;
});

function formatDate(value: string) {
  return value ? new Date(value).toLocaleString() : "";
}

function statusLabel(value: string) {
  if (value === "USED") return t("admin.columns.codes.used");
  if (value === "REVOKED") return t("admin.columns.codes.revoked");
  return t("admin.columns.codes.unused");
}

async function loadSubscriptions() {
  pending.value = true;
  try {
    const response = await $fetch<{ c: number; d?: { subscriptions: any[] } }>("/api/admin/column-subscriptions", {
      query: { status: status.value },
    });
    subscriptions.value = response?.c === 200 ? response.d?.subscriptions || [] : [];
  } finally {
    pending.value = false;
  }
}

async function loadCodes(kind: string) {
  pending.value = true;
  try {
    const response = await $fetch<{ c: number; d?: { codes: any[] } }>("/api/admin/redeem-codes", { query: { kind } });
    codes.value = response?.c === 200 ? response.d?.codes || [] : [];
  } finally {
    pending.value = false;
  }
}

watch(tab, async (value) => {
  if (value === "columns") {
    pending.value = false;
    return;
  }
  if (value === "subscriptions") await loadSubscriptions();
  if (value === "columnCodes") await loadCodes("column");
  if (value === "articleCodes") await loadCodes("article");
});

onMounted(async () => {
  try {
    const response = await $fetch<{ c: number; d?: { columns: any[] } }>("/api/admin/columns", {
      query: { languageCode: locale.value },
    });
    columns.value = response?.c === 200 ? response.d?.columns || [] : [];
  } finally {
    pending.value = false;
  }
});
</script>
