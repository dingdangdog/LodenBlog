<template>
  <div class="space-y-6">
    <section class="bg-surface text-foreground border border-border rounded-2xl p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-semibold">{{ $t("admin.dashboard.creator.overviewTitle") }}</h2>
          <p class="text-sm text-muted mt-1">{{ $t("admin.dashboard.creator.overviewDesc") }}</p>
        </div>
        <button type="button"
          class="px-3 py-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium flex items-center gap-2"
          :disabled="statsLoading" @click="refreshStats">
          <ArrowPathIcon :class="['w-4 h-4', statsLoading && 'animate-spin']" />
          {{ $t("common.refresh") }}
        </button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div class="rounded-xl border border-border p-3">
          <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.totalArticles") }}</p>
          <p class="text-xl font-semibold mt-1">{{ stats.totalArticles ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-border p-3">
          <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.published") }}</p>
          <p class="text-xl font-semibold mt-1">{{ stats.publishedArticles ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-border p-3">
          <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.drafts") }}</p>
          <p class="text-xl font-semibold mt-1">{{ stats.draftArticles ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-border p-3">
          <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.totalViews") }}</p>
          <p class="text-xl font-semibold mt-1">{{ stats.totalViews ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-border p-3">
          <p class="text-xs text-muted">{{ $t("admin.dashboard.lastUpdated") }}</p>
          <p class="text-sm font-medium mt-1 truncate">{{ stats.lastUpdatedTitle || $t("admin.dashboard.noUpdate") }}
          </p>
          <p v-if="stats.lastUpdatedAt" class="text-xs text-muted mt-1 truncate">
            {{ formatDate(stats.lastUpdatedAt) }}
          </p>
        </div>
      </div>
    </section>

    <section class="bg-surface text-foreground border border-border rounded-2xl p-5">
      <h3 class="text-lg font-semibold mb-3">{{ $t("admin.dashboard.quickLinks") }}</h3>
      <div class="space-y-2">
        <NuxtLink v-for="link in quickLinks" :key="link.to" :to="link.to"
          class="flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-surface-muted transition">
          <div class="flex items-center gap-2">
            <component :is="link.icon" class="w-4 h-4 text-muted" />
            <span class="text-sm">{{ link.title }}</span>
          </div>
          <span class="text-xs text-primary-600">{{ $t("admin.dashboard.goTo") }}</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, PencilSquareIcon, PhotoIcon, DocumentTextIcon } from "@heroicons/vue/24/outline";
import { usePermission } from "~/composables/usePermission";
import api from "~/utils/api";

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "creator"],
});

const { isCreator, isAdmin } = usePermission();
const { t } = useI18n();
const localePath = useLocalePath();

const statsLoading = ref(false);
const stats = ref<{
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  lastUpdatedTitle: string | null;
  lastUpdatedAt: string | null;
  languageCount: number;
  themeCount: number;
}>({
  totalArticles: 0,
  publishedArticles: 0,
  draftArticles: 0,
  totalViews: 0,
  lastUpdatedTitle: null,
  lastUpdatedAt: null,
  languageCount: 0,
  themeCount: 0,
});

const loadStats = async () => {
  statsLoading.value = true;
  try {
    const data = await api.get<{
      totalArticles: number;
      publishedArticles: number;
      draftArticles: number;
      totalViews: number;
      lastUpdatedTitle: string | null;
      lastUpdatedAt: string | null;
      languageCount: number;
      themeCount: number;
    }>("/api/creator/dashboard");

    stats.value = data;
  } catch (error) {
    console.error("加载创作者仪表盘数据失败:", error);
  } finally {
    statsLoading.value = false;
  }
};

await loadStats();

const quickLinks = computed(() => {
  const links = [
    {
      title: t("admin.dashboard.links.posts"),
      to: localePath("/admin/posts"),
      icon: PencilSquareIcon,
      show: isCreator.value || isAdmin.value,
    },
    {
      title: t("admin.dashboard.links.media"),
      to: localePath("/admin/media"),
      icon: PhotoIcon,
      show: isCreator.value || isAdmin.value,
    },
    {
      title: t("admin.dashboard.links.translationlogs"),
      to: localePath("/admin/translationlogs"),
      icon: DocumentTextIcon,
      show: isCreator.value || isAdmin.value,
    },
  ];
  return links.filter((l) => l.show);
});

const formatDate = (date?: string | null) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

const refreshStats = () => loadStats();
</script>
