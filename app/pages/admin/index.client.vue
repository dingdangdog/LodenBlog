<template>
  <div class="flex flex-col h-full min-h-0 gap-2 md:gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">{{ $t("admin.dashboard.siteOverview") }}</h2>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      <div class="rounded-xl border border-border p-3">
        <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.totalVisitCount") }}</p>
        <p class="text-xl font-semibold mt-1">{{ totalVisitStats.totalVisitCount ?? "-" }}</p>
      </div>
      <div class="rounded-xl border border-border p-3">
        <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.totalHumanVisitCount") }}</p>
        <p class="text-xl font-semibold mt-1 text-emerald-500">{{ totalVisitStats.totalHumanVisitCount ?? "-" }}</p>
      </div>
      <div class="rounded-xl border border-border p-3">
        <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.totalBotVisitCount") }}</p>
        <p class="text-xl font-semibold mt-1 text-amber-500">{{ totalVisitStats.totalBotVisitCount ?? "-" }}</p>
      </div>
      <div class="rounded-xl border border-border p-3">
        <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.totalArticles") }}</p>
        <p class="text-xl font-semibold mt-1">{{ stats.totalArticles || 0 }}</p>
      </div>
      <div class="rounded-xl border border-border p-3">
        <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.published") }}</p>
        <p class="text-xl font-semibold mt-1">{{ stats.publishedArticles || 0 }}</p>
      </div>
      <div class="rounded-xl border border-border p-3">
        <p class="text-xs text-muted">{{ $t("admin.dashboard.stats.drafts") }}</p>
        <p class="text-xl font-semibold mt-1">{{ stats.draftArticles || 0 }}</p>
      </div>
      <div class="rounded-xl border border-border p-3">
        <p class="text-xs text-muted">{{ $t("admin.dashboard.enabledLanguages") }}</p>
        <p class="text-xl font-semibold mt-1">{{ stats.languageCount || 0 }}</p>
      </div>
      <div class="rounded-xl border border-border p-3">
        <p class="text-xs text-muted">{{ $t("admin.dashboard.themeCount") }}</p>
        <p class="text-xl font-semibold mt-1">{{ stats.themeCount || 0 }}</p>
      </div>
      <!-- <div class="rounded-xl border border-border p-3">
          <p class="text-xs text-muted">{{ $t("admin.dashboard.lastUpdated") }}</p>
          <p class="text-sm font-medium mt-1 truncate">{{ stats.lastUpdatedTitle || $t("admin.dashboard.noUpdate") }}
          </p>
          <p v-if="stats.lastUpdatedAt" class="text-xs text-muted mt-1 truncate">
            {{ formatDate(stats.lastUpdatedAt) }}
          </p>
        </div> -->
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold">{{ $t("admin.dashboard.visitBoard") }}</h2>
      </div>
      <div class="flex items-center gap-2">
        <button v-for="option in [7, 30, 100]" :key="option" type="button" :class="[
          'px-3 py-1.5 text-xs rounded-lg transition border',
          selectedDays === option
            ? 'bg-primary-600 text-white border-primary-600'
            : 'border-border text-foreground hover:bg-surface-muted',
        ]" @click="loadTrendData(option)">
          {{ $t("admin.dashboard.lastNDays", { n: option }) }}
        </button>
        <button type="button"
          class="px-3 py-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium flex items-center gap-2"
          @click="refreshAll" :disabled="isRefreshing">
          <ArrowPathIcon :class="['w-4 h-4', isRefreshing && 'animate-spin']" />
          {{ $t("common.refresh") }}
        </button>
      </div>
    </div>
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2 bg-surface border border-border rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold">{{ $t("admin.dashboard.trendHumanVsBot") }}</h3>
          <span class="text-xs text-muted">{{ $t("admin.dashboard.byDay") }}</span>
        </div>
        <div v-if="trendLoading" class="h-72 flex items-center justify-center text-sm text-muted">
          {{ $t("common.loading") }}
        </div>
        <div v-else-if="!trendData || trendData.dates.length === 0"
          class="h-72 flex items-center justify-center text-sm text-muted">
          {{ $t("admin.dashboard.visitAnalysis.noData") }}
        </div>
        <div v-else class="h-72 overflow-hidden">
          <v-chart :option="trendChartOption" class="h-full w-full" autoresize />
        </div>
      </div>

      <div class="bg-surface border border-border rounded-2xl p-5">
        <h3 class="text-lg font-semibold mb-3">{{ $t("admin.dashboard.visitorDist", { n: selectedDays }) }}</h3>
        <div class="grid grid-cols-2 gap-2 mb-4">
          <div class="rounded-lg border border-border p-2">
            <p class="text-[11px] text-muted">{{ $t("admin.dashboard.totalVisits") }}</p>
            <p class="text-base font-semibold">{{ trendSummary.totalVisits }}</p>
          </div>
          <div class="rounded-lg border border-border p-2">
            <p class="text-[11px] text-muted">{{ $t("admin.dashboard.humanIpBotRatio") }}</p>
            <p class="text-base font-semibold">
              <span class="text-sky-500">{{ trendSummary.humanUniqueIps }}</span>
              <span class="text-muted mx-1">/</span>
              <span>{{ botRatio }}%</span>
            </p>
          </div>
          <div class="rounded-lg border border-border p-2">
            <p class="text-[11px] text-muted">{{ $t("admin.dashboard.humanVisits") }}</p>
            <p class="text-base font-semibold text-emerald-500">
              {{ trendSummary.humanVisits }}
            </p>
          </div>
          <div class="rounded-lg border border-border p-2">
            <p class="text-[11px] text-muted">{{ $t("admin.dashboard.botVisits") }}</p>
            <p class="text-base font-semibold text-amber-500">
              {{ trendSummary.botVisits }}
            </p>
          </div>
        </div>
        <h3 class="text-base font-semibold mb-3">{{ $t("admin.dashboard.botVendorDist") }}</h3>
        <div v-if="!trendSummary.botVendors.length" class="h-48 flex items-center justify-center text-sm text-muted">
          {{ $t("admin.dashboard.noBotData") }}
        </div>
        <div v-else class="space-y-2 max-h-48 overflow-y-auto">
          <div v-for="vendor in trendSummary.botVendors.slice(0, 10)" :key="vendor.vendor"
            class="flex items-center gap-3">
            <div class="w-20 text-xs text-muted uppercase truncate">
              {{ vendor.vendor }}
            </div>
            <div class="flex-1 h-2 rounded bg-surface-muted overflow-hidden">
              <div class="h-full bg-amber-500" :style="{
                width: `${Math.max(
                  3,
                  Math.round((vendor.count / Math.max(trendSummary.botVisits, 1)) * 100)
                )}%`,
              }" />
            </div>
            <div class="w-10 text-right text-xs font-medium">
              {{ vendor.count }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="grid gap-4 lg:grid-cols-3 flex-1 min-h-0">
      <div class="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 flex flex-col min-h-0">
        <div class="flex items-center justify-between mb-2 shrink-0">
          <h3 class="text-lg font-semibold">{{ $t("admin.dashboard.visitAnalysis.articleRanking") }}</h3>
        </div>
        <div class="flex items-center justify-between mb-3 shrink-0">
          <div class="flex items-center gap-2">
            <button v-for="opt in rankingRangeOptions" :key="opt.value" type="button" :class="[
              'px-3 py-1 text-xs rounded-lg border transition',
              rankingRange === opt.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-border hover:bg-surface-muted',
            ]" @click="switchRankingRange(opt.value)">
              {{ opt.label }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button v-for="tab in rankingTabs" :key="tab.value" type="button" :class="[
              'px-3 py-1 text-xs rounded-lg border transition',
              rankingTab === tab.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-border hover:bg-surface-muted',
            ]" @click="rankingTab = tab.value">
              {{ tab.label }}
            </button>
          </div>
        </div>
        <div v-if="rankingLoading" class="space-y-2 flex-1 min-h-0 overflow-y-auto">
          <div v-for="n in 6" :key="n" class="h-12 rounded-lg bg-surface-muted animate-pulse"></div>
        </div>
        <div v-else-if="activeRanking.length === 0" class="flex-1 min-h-0 flex items-center justify-center text-sm text-muted">
          {{ $t("admin.dashboard.visitAnalysis.noData") }}
        </div>
        <div v-else class="space-y-1 flex-1 min-h-0 overflow-y-auto">
          <div v-for="(item, index) in activeRanking" :key="`${rankingTab}-${item.slug}`" role="button"
            class="flex items-center justify-between p-1 md:p-2 rounded-xl hover:bg-surface-muted transition cursor-pointer"
            @click="openArticle(item.slug)">
            <div class="flex items-center gap-3 min-w-0">
              <span
                class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 text-xs font-semibold flex items-center justify-center">
                {{ index + 1 }}
              </span>
              <div class="min-w-0">
                <p class="text-sm font-medium truncate hover:text-primary-600 transition-colors">{{ item.title }}</p>
                <p class="text-xs text-muted truncate">{{ item.slug }}</p>
              </div>
            </div>
            <div class="text-sm font-semibold">{{ item.count }}</div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="bg-surface border border-border rounded-2xl p-5">
          <h3 class="text-lg font-semibold mb-3">{{ $t("admin.dashboard.todaySummary") }}</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted">{{ $t("admin.dashboard.totalVisits") }}</span>
              <span class="font-semibold">{{ todayStats.todayVisitCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">{{ $t("admin.dashboard.humanVisits") }}</span>
              <span class="font-semibold text-emerald-500">{{ todayStats.todayHumanVisitCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">{{ $t("admin.dashboard.botVisits") }}</span>
              <span class="font-semibold text-amber-500">{{ todayStats.todayBotVisitCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted">{{ $t("admin.dashboard.humanIps") }}</span>
              <span class="font-semibold text-sky-500">{{ todayStats.todayHumanUniqueIps }}</span>
            </div>
          </div>
        </div>

        <div class="bg-surface border border-border rounded-2xl p-5">
          <h3 class="text-lg font-semibold mb-3">{{ $t("admin.dashboard.quickLinks") }}</h3>
          <div class="space-y-2">
            <NuxtLink v-for="link in quickLinks" :key="link.to" :to="link.to"
              class="flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-surface-muted transition">
              <div class="flex items-center gap-2">
                <component :is="link.icon" class="w-4 h-4 text-muted" />
                <span class="text-sm">{{ link.title }}</span>
              </div>
              <span class="text-xs text-primary-600">{{ $t("admin.dashboard.enter") }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, PencilSquareIcon, SwatchIcon } from "@heroicons/vue/24/outline";
import { usePermission } from "~/composables/usePermission";
import { useThemeStore } from "~/stores/theme";
import api from "~/utils/api";

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "redirect-creator-to-dashboard"],
});

interface BotVendorItem {
  vendor: string;
  count: number;
}

interface VisitSummary {
  totalVisits: number;
  humanVisits: number;
  humanUniqueIps: number;
  botVisits: number;
  unknownVisits: number;
  botVendors: BotVendorItem[];
}

interface RankingItem {
  slug: string;
  count: number;
  title: string;
  articleBaseId: string | null;
  languageCode: string | null;
}

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

const totalVisitStats = ref<{
  totalVisitCount: number;
  totalHumanVisitCount: number;
  totalBotVisitCount: number;
}>({
  totalVisitCount: 0,
  totalHumanVisitCount: 0,
  totalBotVisitCount: 0,
});

const todayVisitLoading = ref(false);
const todayStats = ref<{
  todayVisitCount: number;
  todayHumanVisitCount: number;
  todayBotVisitCount: number;
  todayHumanUniqueIps: number;
  todayUnknownVisitCount: number;
  topBotVendors: any[];
}>({
  todayVisitCount: 0,
  todayHumanVisitCount: 0,
  todayBotVisitCount: 0,
  todayHumanUniqueIps: 0,
  todayUnknownVisitCount: 0,
  topBotVendors: [],
});

const rankingLoading = ref(false);
const rankingAll = ref<RankingItem[]>([]);
const rankingHuman = ref<RankingItem[]>([]);
const rankingBot = ref<RankingItem[]>([]);

const selectedDays = ref(7);
const trendLoading = ref(false);
const trendResponse = ref<{
  days: number;
  dates: string[];
  counts: number[];
  humanCounts: number[];
  botCounts: number[];
  summary: VisitSummary;
} | null>(null);

const rankingTab = ref<"human" | "bot" | "all">("human");
const rankingTabs = computed(() => [
  { value: "human" as const, label: t("admin.dashboard.rankingHuman") },
  { value: "bot" as const, label: t("admin.dashboard.rankingBot") },
  { value: "all" as const, label: t("admin.dashboard.rankingAll") },
]);
const rankingRange = ref<"today" | "week" | "all">("today");
const rankingRangeOptions = computed(() => [
  { value: "today" as const, label: t("admin.dashboard.visitAnalysis.rangeToday") },
  { value: "week" as const, label: t("admin.dashboard.visitAnalysis.rangeWeek") },
  { value: "all" as const, label: t("admin.dashboard.visitAnalysis.rangeAll") },
]);

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
    console.error("加载站点统计数据失败:", error);
  } finally {
    statsLoading.value = false;
  }
};

const loadTotalVisit = async () => {
  try {
    const data = await api.get<{
      totalVisitCount: number;
      totalHumanVisitCount: number;
      totalBotVisitCount: number;
    }>("/api/admin/analyze/total-visit");
    totalVisitStats.value = data;
  } catch (error) {
    console.error("加载总访问量失败:", error);
  }
};

const loadTodayVisit = async () => {
  todayVisitLoading.value = true;
  try {
    const data = await api.get<{
      todayVisitCount: number;
      todayHumanVisitCount: number;
      todayBotVisitCount: number;
      todayHumanUniqueIps: number;
      todayUnknownVisitCount: number;
      topBotVendors: any[];
    }>("/api/admin/analyze/today-visit");

    todayStats.value = data;
  } catch (error) {
    console.error("获取今日访问数据失败:", error);
    todayStats.value = {
      todayVisitCount: 0,
      todayHumanVisitCount: 0,
      todayBotVisitCount: 0,
      todayHumanUniqueIps: 0,
      todayUnknownVisitCount: 0,
      topBotVendors: [],
    };
  } finally {
    todayVisitLoading.value = false;
  }
};

const loadRanking = async (range?: string) => {
  rankingLoading.value = true;
  try {
    const params: Record<string, string> = {};
    if (range) params.range = range;
    const data = await api.get<{
      ranking: RankingItem[];
      humanRanking: RankingItem[];
      botRanking: RankingItem[];
    }>("/api/admin/analyze/daily-ranking", { query: params });

    rankingAll.value = data.ranking || [];
    rankingHuman.value = data.humanRanking || [];
    rankingBot.value = data.botRanking || [];
  } catch (error) {
    console.error("获取访问排名数据失败:", error);
    rankingAll.value = [];
    rankingHuman.value = [];
    rankingBot.value = [];
  } finally {
    rankingLoading.value = false;
  }
};

const switchRankingRange = async (range: "today" | "week" | "all") => {
  rankingRange.value = range;
  await loadRanking(range);
};

const openArticle = (slug: string) => {
  const url = localePath(`/post/${slug}`);
  window.open(url, "_blank");
};

const loadTrendData = async (days: number) => {
  selectedDays.value = days;
  trendLoading.value = true;
  try {
    trendResponse.value = await api.get("/api/admin/analyze/visit-trend", {
      query: { days },
    });
  } catch (error) {
    console.error("加载访问趋势失败:", error);
    trendResponse.value = {
      days,
      dates: [],
      counts: [],
      humanCounts: [],
      botCounts: [],
      summary: {
        totalVisits: 0,
        humanVisits: 0,
        humanUniqueIps: 0,
        botVisits: 0,
        unknownVisits: 0,
        botVendors: [],
      },
    };
  } finally {
    trendLoading.value = false;
  }
};

await Promise.all([loadStats(), loadTotalVisit(), loadTodayVisit(), loadRanking(rankingRange.value), loadTrendData(7)]);

const trendData = computed(() => trendResponse.value);
const trendSummary = computed<VisitSummary>(() => {
  return (
    trendData.value?.summary || {
      totalVisits: 0,
      humanVisits: 0,
      humanUniqueIps: 0,
      botVisits: 0,
      unknownVisits: 0,
      botVendors: [],
    }
  );
});

const activeRanking = computed(() => {
  if (rankingTab.value === "human") return rankingHuman.value;
  if (rankingTab.value === "bot") return rankingBot.value;
  return rankingAll.value;
});

const botRatio = computed(() => {
  const total = trendSummary.value.totalVisits;
  if (!total) return 0;
  return Math.round((trendSummary.value.botVisits / total) * 100);
});

const isRefreshing = computed(
  () => statsLoading.value || todayVisitLoading.value || rankingLoading.value || trendLoading.value
);

const quickLinks = computed(() => {
  const links = [
    {
      title: t("admin.dashboard.links.posts"),
      to: "/admin/posts",
      icon: PencilSquareIcon,
      show: isCreator.value || isAdmin.value,
    },
    {
      title: t("admin.dashboard.links.themes"),
      to: { path: localePath("/admin/settings"), query: { tab: "themes" } },
      icon: SwatchIcon,
      show: isAdmin.value,
    },
  ];
  return links.filter((link) => link.show);
});

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.isDark);
const trendChartOption = computed(() => {
  if (!trendData.value || !trendData.value.dates.length) {
    return {};
  }

  const textColor = isDark.value ? "#9CA3AF" : "#6B7280";
  const gridColor = isDark.value ? "#374151" : "#E5E7EB";
  const totalLineColor = "#3B82F6";
  const humanLineColor = "#10B981";
  const botLineColor = "#F59E0B";

  const formattedDates = trendData.value.dates.map((date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const formatFullDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    grid: {
      left: "50px",
      right: "20px",
      top: "20px",
      bottom: "20px",
      containLabel: false,
    },
    xAxis: {
      type: "category",
      data: formattedDates,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
      axisLabel: {
        color: textColor,
        fontSize: 10,
      },
      splitLine: {
        lineStyle: {
          color: gridColor,
          type: "dashed",
        },
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark.value ? "#1F2937" : "#FFFFFF",
      borderColor: gridColor,
      textStyle: {
        color: isDark.value ? "#F3F4F6" : "#111827",
      },
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: totalLineColor,
        },
      },
      formatter: (params: any) => {
        if (!params || !Array.isArray(params) || params.length === 0) {
          return "";
        }
        const dataIndex = params[0].dataIndex;
        const rawDate = trendData.value?.dates?.[dataIndex];
        if (!rawDate) return "";
        const fullDate = formatFullDate(rawDate);
        return params
          .map((item: any) => `${item.seriesName}: ${item.value}`)
          .reduce((acc: string, line: string) => `${acc}<br/>${line}`, fullDate);
      },
    },
    series: [
      {
        name: t("admin.dashboard.chartTotal"),
        type: "line",
        smooth: true,
        data: trendData.value.counts,
        itemStyle: {
          color: totalLineColor,
        },
        symbol: "circle",
        symbolSize: 4,
      },
      {
        name: t("admin.dashboard.chartHuman"),
        type: "line",
        smooth: true,
        data: trendData.value.humanCounts,
        itemStyle: {
          color: humanLineColor,
        },
        symbol: "circle",
        symbolSize: 4,
      },
      {
        name: t("admin.dashboard.chartBot"),
        type: "line",
        smooth: true,
        data: trendData.value.botCounts,
        itemStyle: {
          color: botLineColor,
        },
        symbol: "circle",
        symbolSize: 4,
      },
    ],
  };
});

const formatDate = (date?: string | null) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

const refreshAll = async () => {
  await Promise.all([
    loadStats(),
    loadTotalVisit(),
    loadTodayVisit(),
    loadRanking(rankingRange.value),
    loadTrendData(selectedDays.value),
  ]);
};
</script>
