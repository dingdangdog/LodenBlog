<template>
  <div class="container mx-auto max-w-6xl min-h-full px-2 py-4 md:px-4 md:py-8">
    <h1 class="mb-4 text-xl font-semibold text-foreground md:mb-6 md:text-2xl">
      {{ $t("my.center.subscriptions") }}
    </h1>

    <section class="mb-6 rounded-xl border border-border bg-surface p-4 md:p-5">
      <CommonRedeemCodeForm @success="refresh" />
    </section>

    <div v-if="pending" class="py-12 text-center text-muted">
      <ArrowPathIcon class="mx-auto mb-2 h-8 w-8 animate-spin" />
      <p>{{ $t("common.loading") }}</p>
    </div>
    <div v-else-if="items.length === 0" class="py-12 text-center text-muted">
      <RectangleStackIcon class="mx-auto mb-3 h-12 w-12" />
      <p class="font-medium">{{ $t("column.noSubscriptions") }}</p>
    </div>
    <div v-else class="space-y-4">
      <article v-for="item in items" :key="item.id" class="rounded-xl border border-border bg-surface p-4 md:p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <NuxtLink
              v-if="item.slug && !item.removed"
              :to="localePath(`/column/${item.slug}`)"
              class="text-base font-semibold text-foreground hover:text-primary-600 md:text-lg"
            >
              {{ item.title }}
            </NuxtLink>
            <p v-else class="text-base font-semibold text-foreground md:text-lg">{{ item.title }}</p>
            <p v-if="item.removed" class="mt-1 text-sm text-muted">{{ $t("column.removed") }}</p>
            <p class="mt-1 text-sm text-muted">
              {{ formatDate(item.startsAt) }} – {{ formatDate(item.expiresAt) }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-foreground">
              {{ $t("column.remainingDays", { count: item.remainingDays }) }}
            </span>
            <span
              class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
              :class="item.active
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-surface-muted text-muted'"
            >
              {{ item.active ? $t("column.active") : $t("column.expired") }}
            </span>
          </div>
        </div>
        <details v-if="item.logs?.length" class="mt-4 border-t border-border pt-3">
          <summary class="cursor-pointer text-sm font-medium text-foreground">{{ $t("column.history") }}</summary>
          <ul class="mt-2 space-y-1 text-sm text-muted">
            <li v-for="log in item.logs" :key="log.id">
              {{ $t("column.durationDays", { count: log.durationDays }) }}
              · {{ formatDate(log.appliedFrom) }} – {{ formatDate(log.appliedTo) }}
            </li>
          </ul>
        </details>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, RectangleStackIcon } from "@heroicons/vue/24/outline";

definePageMeta({ requiresAuth: true, middleware: ["auth"] });
const localePath = useLocalePath();
const { locale } = useI18n();
const { data, pending, refresh } = await useFetch<{ c: number; d?: { subscriptions: any[] } }>("/api/entry/me/subscriptions", {
  query: computed(() => ({ languageCode: locale.value })),
});
const items = computed(() => (data.value?.c === 200 ? data.value.d?.subscriptions || [] : []));
function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "";
}
</script>
