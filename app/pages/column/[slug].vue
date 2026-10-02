<template>
  <div class="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-6xl min-h-full">
    <div v-if="pending" class="py-16 text-center text-muted">
      <ArrowPathIcon class="mx-auto mb-2 h-8 w-8 animate-spin" />
      <p>{{ $t("common.loading") }}</p>
    </div>

    <div v-else-if="!column" class="py-16 text-center text-muted">
      <RectangleStackIcon class="mx-auto mb-3 h-12 w-12 text-muted" />
      <p class="font-medium">{{ $t("column.notFound") }}</p>
    </div>

    <div v-else class="space-y-4 md:space-y-8">
      <header class="overflow-hidden rounded-xl border border-border bg-surface">
        <div class="flex flex-col md:flex-row">
          <div v-if="column.featuredImage" class="h-48 shrink-0 md:h-auto md:w-80">
            <img :src="column.featuredImage" :alt="column.title" class="h-full w-full object-cover" />
          </div>
          <div class="min-w-0 flex-1 space-y-4 p-4 md:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <h1 class="text-2xl font-bold text-foreground md:text-3xl">{{ column.title }}</h1>
              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                :class="column.subscribed
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-surface-muted text-muted'"
              >
                {{ column.subscribed ? $t("column.active") : $t("column.column") }}
              </span>
            </div>
            <p v-if="column.description" class="whitespace-pre-wrap text-sm text-muted md:text-base">
              {{ column.description }}
            </p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span>
                <span class="font-semibold text-foreground">{{ articles.length }}</span>
                {{ $t("common.articles") }}
              </span>
              <span v-if="column.subscribed && column.subscriptionExpiresAt">
                {{ $t("column.subscribedUntil", { date: formatDate(column.subscriptionExpiresAt) }) }}
              </span>
            </div>
            <div class="rounded-lg border border-border bg-background p-3">
              <p v-if="!column.subscribed" class="mb-2 text-sm text-muted">{{ $t("column.subscribeHint") }}</p>
              <CommonRedeemCodeForm @success="refresh" />
            </div>
          </div>
        </div>
      </header>

      <section>
        <h2 class="mb-3 ml-2 text-xl font-semibold text-foreground md:mb-6 md:text-2xl">
          {{ $t("column.articles") }}
        </h2>
        <div v-if="articles.length" class="space-y-4 md:space-y-6">
          <CommonArticleCard v-for="article in articles" :key="article.id" :article="article" />
        </div>
        <div v-else class="py-12 text-center text-muted">
          <DocumentTextIcon class="mx-auto mb-3 h-12 w-12" />
          <p class="font-medium">{{ $t("column.emptyArticles") }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, DocumentTextIcon, RectangleStackIcon } from "@heroicons/vue/24/outline";

const route = useRoute();
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
