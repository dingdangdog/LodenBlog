<template>
  <div class="container mx-auto max-w-3xl space-y-4 px-4 py-8">
    <h1 class="text-2xl font-semibold text-foreground">{{ $t("my.center.unlocks") }}</h1>
    <p v-if="items.length === 0" class="text-sm text-muted">{{ $t("column.noUnlocks") }}</p>
    <article v-for="item in items" :key="item.id" class="rounded-xl border border-border bg-surface p-4">
      <NuxtLink v-if="item.slug" :to="localePath(`/post/${item.slug}`)" class="font-medium text-foreground">{{ item.title }}</NuxtLink>
      <p v-else class="font-medium">{{ item.title }}</p>
      <p class="mt-1 text-sm text-muted">{{ $t("column.unlockedAt") }} {{ formatDate(item.unlockedAt) }}</p>
      <p v-if="!item.readable" class="mt-1 text-sm text-muted">{{ $t("column.notReadable") }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ requiresAuth: true, middleware: ["auth"] });
const localePath = useLocalePath();
const { locale } = useI18n();
const { data } = await useFetch<{ c: number; d?: { unlocks: any[] } }>("/api/entry/me/unlocks", {
  query: computed(() => ({ languageCode: locale.value })),
});
const items = computed(() => (data.value?.c === 200 ? data.value.d?.unlocks || [] : []));
function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "";
}
</script>
