<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-surface rounded-xl border border-border p-6 md:p-8">
      <h1 class="text-3xl font-bold text-foreground mb-2">
        {{ $t("links.title") }}
      </h1>
      <p class="text-muted text-sm mb-8">
        {{ $t("links.subtitle") }}
      </p>

      <div v-if="pending" class="py-12 text-center text-muted">
        <span class="inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p class="mt-2 text-sm">{{ $t("common.loading") }}</p>
      </div>

      <div v-else-if="!payload?.list?.length" class="py-12 text-center text-muted">
        <p class="text-sm">{{ $t("links.empty") }}</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a v-for="link in payload.list" :key="link.id" :href="link.url" target="_blank" rel="noopener noreferrer"
          class="flex items-start gap-4 p-4 rounded-xl border border-border bg-surface-muted/50 hover:border-primary-500/50 hover:bg-primary-500/5 dark:hover:bg-primary-500/10 transition-colors text-left">
          <img v-if="link.icon" :src="link.icon" :alt="link.name"
            class="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          <div v-else
            class="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400 font-semibold text-lg">
            {{ (link.name || "").charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold text-foreground truncate">
              {{ link.name }}
            </div>
            <p v-if="link.description" class="text-sm text-muted line-clamp-2 mt-0.5">
              {{ link.description }}
            </p>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiresAuth: false,
});

const appStore = useAppStore();
const { t } = useI18n();

const { data: linksResponse, pending } = await useFetch<{
  c: number;
  d: {
    list: { id: string; name: string; url: string; icon: string | null; description: string | null }[];
    total: number;
  };
}>("/api/links", { key: "page-links" });

const payload = computed(() =>
  linksResponse.value?.c === 200 ? linksResponse.value.d : null
);

useHead({
  title: computed(() => `${t("links.title")} - ${appStore.siteTitle}`),
  meta: [
    {
      name: "description",
      content: computed(
        () => appStore.siteDescription || t("links.subtitle")
      ),
    },
  ],
});
</script>
