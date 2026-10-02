<template>
  <div class="container mx-auto max-w-6xl min-h-full px-2 py-4 md:px-4 md:py-8">
    <h1 class="mb-4 text-xl font-semibold text-foreground md:mb-6 md:text-2xl">
      {{ $t("my.center.unlocks") }}
    </h1>

    <div v-if="pending" class="py-12 text-center text-muted">
      <ArrowPathIcon class="mx-auto mb-2 h-8 w-8 animate-spin" />
      <p>{{ $t("common.loading") }}</p>
    </div>
    <div v-else-if="items.length === 0" class="py-12 text-center text-muted">
      <LockOpenIcon class="mx-auto mb-3 h-12 w-12" />
      <p class="font-medium">{{ $t("column.noUnlocks") }}</p>
    </div>
    <div v-else class="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      <article v-for="item in items" :key="item.id" class="flex items-start gap-3 p-4 md:p-5">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <LockOpenIcon class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <NuxtLink
            v-if="item.slug"
            :to="localePath(`/post/${item.slug}`)"
            class="font-semibold text-foreground hover:text-primary-600"
          >
            {{ item.title }}
          </NuxtLink>
          <p v-else class="font-semibold text-foreground">{{ item.title }}</p>
          <p class="mt-1 text-sm text-muted">{{ $t("column.unlockedAt") }} {{ formatDate(item.unlockedAt) }}</p>
          <p v-if="!item.readable" class="mt-1 text-sm text-muted">{{ $t("column.notReadable") }}</p>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, LockOpenIcon } from "@heroicons/vue/24/outline";

definePageMeta({ requiresAuth: true, middleware: ["auth"] });
const localePath = useLocalePath();
const { locale } = useI18n();
const { data, pending } = await useFetch<{ c: number; d?: { unlocks: any[] } }>("/api/entry/me/unlocks", {
  query: computed(() => ({ languageCode: locale.value })),
});
const items = computed(() => (data.value?.c === 200 ? data.value.d?.unlocks || [] : []));
function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "";
}
</script>
