<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div v-if="pending" class="flex items-center justify-center py-12">
      <ArrowPathIcon class="w-8 h-8 animate-spin text-muted" />
    </div>
    <div v-else-if="error || !payload" class="text-center py-12 text-muted">
      {{ error || $t("common.notFound") || "页面不存在" }}
    </div>
    <div v-else class="bg-surface rounded-xl border border-border p-8">
      <h1 class="text-3xl font-bold text-foreground mb-2">
        {{ payload.title }}
      </h1>
      <p v-if="payload.updatedAt" class="text-sm text-muted mb-8">
        {{ $t("admin.settings.info.updatedAt") || "更新时间" }}: {{ formatDate(payload.updatedAt) }}
      </p>

      <div class="prose prose-gray dark:prose-invert max-w-none">
        <MarkdownRenderer :content="payload.content" :show-catalog="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon } from "@heroicons/vue/24/outline";

definePageMeta({
  requiresAuth: false,
});

const route = useRoute();
const localePath = useLocalePath();
const { locale } = useI18n();
const appStore = useAppStore();

const slug = computed(() => {
  const s = route.params.slug;
  if (Array.isArray(s)) return s[0] ?? "";
  return s ?? "";
});

// 无 slug 时（如访问 /info）重定向到 about
if (!slug.value) {
  await navigateTo(localePath("/info/about"), { replace: true });
}

const { data: response, pending, error } = await useFetch<{ c: number; d?: any; m?: string }>(
  () => `/api/info/${slug.value || "about"}`,
  {
    query: { languageCode: locale },
    key: () => `info-${slug.value || "empty"}-${locale.value}`,
    watch: [locale, slug],
  }
);

const payload = computed(() => {
  const res = response.value as { c: number; d?: any; m?: string } | null;
  if (res?.c === 200 && res?.d) return res.d;
  return null;
});

function formatDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
}

useHead({
  title: computed(() =>
    payload.value ? `${payload.value.title} - ${appStore.siteTitle}` : appStore.siteTitle
  ),
  meta: [
    {
      name: "description",
      content: computed(
        () => appStore.siteDescription || payload.value?.title || ""
      ),
    },
    {
      name: "keywords",
      content: computed(() => appStore.siteKeyword),
    },
  ],
});
</script>
