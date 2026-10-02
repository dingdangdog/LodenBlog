<template>
  <div class="container mx-auto max-w-3xl px-4 py-8">
    <div v-if="pending" class="text-sm text-muted">{{ $t("common.loading") }}</div>
    <div v-else-if="!column" class="text-sm text-muted">{{ $t("column.notFound") }}</div>
    <div v-else class="space-y-6">
      <header class="space-y-3">
        <img v-if="column.featuredImage" :src="column.featuredImage" :alt="column.title" class="h-48 w-full rounded-xl object-cover" />
        <h1 class="text-3xl font-semibold text-foreground">{{ column.title }}</h1>
        <p v-if="column.description" class="whitespace-pre-wrap text-muted">{{ column.description }}</p>
        <p class="text-sm text-muted">{{ $t("column.subscribeHint") }}</p>
        <p v-if="column.subscribed" class="text-sm text-foreground">
          {{ $t("column.active") }} · {{ $t("column.expiresAt") }} {{ formatDate(column.subscriptionExpiresAt) }}
        </p>
        <CommonRedeemCodeForm @success="refresh" />
      </header>
      <section class="space-y-3">
        <h2 class="text-lg font-semibold">{{ $t("column.articles") }}</h2>
        <p v-if="articles.length === 0" class="text-sm text-muted">{{ $t("column.emptyArticles") }}</p>
        <NuxtLink v-for="article in articles" :key="article.id" :to="localePath(`/post/${article.slug}`)" class="block rounded-xl border border-border p-4">
          <div class="flex items-center justify-between gap-3">
            <p class="font-medium text-foreground">{{ article.title }}</p>
            <span v-if="article.locked" class="rounded-full bg-surface-muted px-2 py-1 text-xs text-muted">{{ $t("column.column") }}</span>
          </div>
          <p v-if="article.excerpt" class="mt-1 line-clamp-2 text-sm text-muted">{{ article.excerpt }}</p>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const localePath = useLocalePath();
const { locale } = useI18n();
const slug = computed(() => String(route.params.slug || ""));

const { data, pending, refresh } = await useFetch<{ c: number; d?: { column: any; articles: any[] } }>(
  () => `/api/columns/${slug.value}`,
  { query: computed(() => ({ languageCode: locale.value })) }
);

const column = computed(() => (data.value?.c === 200 ? data.value.d?.column : null));
const articles = computed(() => (data.value?.c === 200 ? data.value.d?.articles || [] : []));

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "";
}

useHead(() => ({
  title: column.value?.seoTitle || column.value?.title || "",
  meta: [
    { name: "description", content: column.value?.seoDescription || column.value?.description || "" },
  ],
}));
</script>
