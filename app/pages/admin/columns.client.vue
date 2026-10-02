<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-semibold text-foreground">{{ $t("admin.columns.title") }}</h1>
      <NuxtLink :to="localePath('/admin/editcolumn')" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">
        {{ $t("admin.columns.create") }}
      </NuxtLink>
    </div>
    <p v-if="pending" class="text-sm text-muted">{{ $t("common.loading") }}</p>
    <p v-else-if="columns.length === 0" class="text-sm text-muted">{{ $t("admin.columns.empty") }}</p>
    <ul v-else class="space-y-3">
      <li v-for="item in columns" :key="item.id" class="rounded-xl border border-border bg-surface p-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="font-medium text-foreground">{{ item.title || item.slug || item.id }}</p>
            <p class="text-xs text-muted">/column/{{ item.slug }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-surface-muted px-2 py-1 text-xs text-muted">
              {{ item.isPublished ? $t("admin.columns.published") : $t("admin.columns.draft") }}
            </span>
            <NuxtLink :to="localePath(`/admin/editcolumn?id=${item.id}`)" class="rounded-lg border border-border px-3 py-1.5 text-sm">
              {{ $t("common.edit") }}
            </NuxtLink>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "creator"],
});

const localePath = useLocalePath();
const { locale } = useI18n();
const pending = ref(true);
const columns = ref<any[]>([]);

onMounted(async () => {
  const response = await $fetch<{ c: number; d?: { columns: any[] } }>("/api/creator/columns", {
    query: { languageCode: locale.value },
  });
  columns.value = response?.c === 200 ? response.d?.columns || [] : [];
  pending.value = false;
});
</script>
