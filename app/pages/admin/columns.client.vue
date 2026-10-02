<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <button
        type="button"
        class="rounded-xl border border-border p-2 text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"
        :disabled="pending"
        :title="$t('common.refresh')"
        @click="load"
      >
        <ArrowPathIcon class="h-4 w-4" :class="pending && 'animate-spin'" />
      </button>
      <NuxtLink
        :to="localePath('/admin/editcolumn')"
        class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        <PlusIcon class="h-4 w-4" />
        {{ $t("admin.columns.create") }}
      </NuxtLink>
    </div>

    <section class="overflow-hidden rounded-2xl border border-border bg-surface">
      <div class="flex items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
        <h1 class="truncate text-base font-semibold text-foreground sm:text-lg">{{ $t("admin.columns.title") }}</h1>
        <span class="shrink-0 rounded-lg bg-surface-muted px-2 py-1 text-xs font-medium text-muted">{{ columns.length }}</span>
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted">
        <ArrowPathIcon class="mx-auto mb-2 h-6 w-6 animate-spin" />
        <p>{{ $t("common.loading") }}</p>
      </div>
      <div v-else-if="!columns.length" class="p-8 text-center text-sm text-muted">
        <RectangleStackIcon class="mx-auto mb-3 h-12 w-12" />
        <p class="mb-1 font-medium">{{ $t("admin.columns.empty") }}</p>
        <p class="text-xs">{{ $t("admin.columns.actions.createHint") }}</p>
      </div>
      <div v-else class="divide-y divide-border">
        <article v-for="item in columns" :key="item.id" class="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
          <div class="flex min-w-0 flex-1 gap-3">
            <div v-if="item.featuredImage" class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted sm:h-20 sm:w-20">
              <img :src="item.featuredImage" :alt="item.title" class="h-full w-full object-cover" />
            </div>
            <div v-else class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-muted sm:h-20 sm:w-20">
              <RectangleStackIcon class="h-7 w-7 text-muted sm:h-9 sm:w-9" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-sm font-semibold text-foreground sm:text-base">{{ item.title || item.slug || item.id }}</h2>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <span
                  class="rounded px-2 py-0.5 text-xs font-medium"
                  :class="item.isPublished
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'"
                >
                  {{ item.isPublished ? $t("admin.columns.published") : $t("admin.columns.draft") }}
                </span>
                <span class="text-xs text-muted">{{ formatDate(item.updatedAt) }}</span>
              </div>
              <p v-if="item.slug" class="mt-1 truncate text-xs text-muted">/column/{{ item.slug }}</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-1">
            <NuxtLink
              v-if="item.isPublished && item.slug"
              :to="localePath(`/column/${item.slug}`)"
              class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              :title="$t('column.viewColumn')"
            >
              <ArrowTopRightOnSquareIcon class="h-5 w-5" />
            </NuxtLink>
            <NuxtLink
              :to="localePath(`/admin/editcolumn?id=${item.id}`)"
              class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-primary-600"
              :title="$t('common.edit')"
            >
              <PencilSquareIcon class="h-5 w-5" />
            </NuxtLink>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, PencilSquareIcon, PlusIcon, RectangleStackIcon } from "@heroicons/vue/24/outline";
import { formatDate } from "~/utils/common";

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "creator"],
});

const localePath = useLocalePath();
const { locale } = useI18n();
const pending = ref(true);
const columns = ref<any[]>([]);

async function load() {
  pending.value = true;
  try {
    const response = await $fetch<{ c: number; d?: { columns: any[] } }>("/api/creator/columns", {
      query: { languageCode: locale.value },
    });
    columns.value = response?.c === 200 ? response.d?.columns || [] : [];
  } finally {
    pending.value = false;
  }
}

onMounted(load);
</script>
