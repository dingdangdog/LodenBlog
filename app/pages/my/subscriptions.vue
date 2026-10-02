<template>
  <div class="container mx-auto max-w-3xl px-4 py-8 space-y-4">
    <h1 class="text-2xl font-semibold text-foreground">{{ $t("my.center.subscriptions") }}</h1>
    <CommonRedeemCodeForm @success="refresh" />
    <p v-if="items.length === 0" class="text-sm text-muted">{{ $t("column.noSubscriptions") }}</p>
    <article v-for="item in items" :key="item.id" class="rounded-xl border border-border bg-surface p-4 space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <NuxtLink v-if="item.slug" :to="localePath(`/column/${item.slug}`)" class="font-medium text-foreground">{{ item.title }}</NuxtLink>
        <span v-else class="font-medium">{{ item.title }}</span>
        <span class="text-xs text-muted">{{ item.active ? $t("column.active") : $t("column.expired") }}</span>
      </div>
      <p class="text-sm text-muted">
        {{ $t("column.startsAt") }} {{ formatDate(item.startsAt) }} · {{ $t("column.expiresAt") }} {{ formatDate(item.expiresAt) }}
        · {{ $t("column.remainingDays", { count: item.remainingDays }) }}
      </p>
      <h2 class="text-sm font-medium">{{ $t("column.history") }}</h2>
      <ul class="space-y-1 text-xs text-muted">
        <li v-for="log in item.logs" :key="log.id">
          {{ $t("column.durationDays", { count: log.durationDays }) }} · {{ formatDate(log.appliedFrom) }} - {{ formatDate(log.appliedTo) }}
        </li>
      </ul>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ requiresAuth: true, middleware: ["auth"] });
const localePath = useLocalePath();
const { locale } = useI18n();
const { data, refresh } = await useFetch<{ c: number; d?: { subscriptions: any[] } }>("/api/entry/me/subscriptions", {
  query: computed(() => ({ languageCode: locale.value })),
});
const items = computed(() => (data.value?.c === 200 ? data.value.d?.subscriptions || [] : []));
function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "";
}
</script>
