<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-foreground">{{ $t("admin.columns.records.title") }}</h1>
    <p class="text-sm text-muted">{{ $t("admin.columns.records.readonly") }}</p>
    <div class="flex flex-wrap gap-2">
      <button v-for="item in tabs" :key="item.id" type="button" class="rounded-lg px-3 py-1.5 text-sm" :class="tab === item.id ? 'bg-primary-600 text-white' : 'border border-border'" @click="tab = item.id">
        {{ item.label }}
      </button>
    </div>

    <ul v-if="tab === 'columns'" class="space-y-2">
      <li v-for="item in columns" :key="item.id" class="rounded-lg border border-border p-3 text-sm">
        <p class="font-medium">{{ item.title || item.id }}</p>
        <p class="text-muted">{{ item.author?.name || item.author?.username }} · {{ item.isPublished ? $t("admin.columns.published") : $t("admin.columns.draft") }}</p>
      </li>
    </ul>

    <div v-else-if="tab === 'subscriptions'" class="space-y-3">
      <div class="w-full sm:w-48">
        <AppSelect
          v-model="status"
          :options="statusOptions"
          :allow-clear="false"
          @change="loadSubscriptions"
        />
      </div>
      <article v-for="item in subscriptions" :key="item.id" class="rounded-lg border border-border p-3 text-sm">
        <p class="font-medium">{{ item.columnTitle }} · {{ item.user?.name || item.user?.username }}</p>
        <p class="text-muted">{{ item.active ? $t("column.active") : $t("column.expired") }} · {{ formatDate(item.startsAt) }} - {{ formatDate(item.expiresAt) }}</p>
        <ul class="mt-2 space-y-1 text-xs text-muted">
          <li v-for="log in item.logs" :key="log.id">{{ $t("column.durationDays", { count: log.durationDays }) }} · {{ formatDate(log.appliedFrom) }} - {{ formatDate(log.appliedTo) }}</li>
        </ul>
      </article>
    </div>

    <ul v-else class="space-y-2">
      <li v-for="item in codes" :key="item.id" class="rounded-lg border border-border p-3 font-mono text-sm">
        {{ item.code }}
        <span class="ml-2 font-sans text-xs text-muted">{{ item.status }}<span v-if="item.durationDays"> · {{ item.durationDays }}</span></span>
      </li>
    </ul>
    <p v-if="empty" class="text-sm text-muted">{{ $t("common.noData") }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "admin"],
});

const { t, locale } = useI18n();
const tab = ref("columns");
const status = ref("all");
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

async function loadSubscriptions() {
  const response = await $fetch<{ c: number; d?: { subscriptions: any[] } }>("/api/admin/column-subscriptions", {
    query: { status: status.value },
  });
  subscriptions.value = response?.c === 200 ? response.d?.subscriptions || [] : [];
}

async function loadCodes(kind: string) {
  const response = await $fetch<{ c: number; d?: { codes: any[] } }>("/api/admin/redeem-codes", { query: { kind } });
  codes.value = response?.c === 200 ? response.d?.codes || [] : [];
}

watch(tab, async (value) => {
  if (value === "subscriptions") await loadSubscriptions();
  if (value === "columnCodes") await loadCodes("column");
  if (value === "articleCodes") await loadCodes("article");
});

onMounted(async () => {
  const response = await $fetch<{ c: number; d?: { columns: any[] } }>("/api/admin/columns", {
    query: { languageCode: locale.value },
  });
  columns.value = response?.c === 200 ? response.d?.columns || [] : [];
});
</script>
