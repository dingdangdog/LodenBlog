<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div
      class="bg-surface text-foreground border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 class="text-lg font-semibold text-foreground">
            {{ $t("admin.posts.visitAnalysis.title") }}
          </h3>
          <p v-if="articleTitle" class="text-sm text-muted mt-1">
            {{ articleTitle }}
          </p>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="text-muted hover:text-foreground"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 控制栏 -->
      <div class="p-6 border-b border-border space-y-4">
        <!-- 天数选择 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted">
            {{ $t("admin.posts.visitAnalysis.timeRange") }}:
          </span>
          <button
            v-for="dayOption in [7, 30, 100]"
            :key="dayOption"
            @click="loadData(dayOption, selectedLanguage)"
            :class="getButtonClass(selectedDays === dayOption)"
          >
            {{ getDaysLabel(dayOption) }}
          </button>
        </div>

        <!-- 语言选择 -->
        <div v-if="availableLanguages.length > 1" class="flex items-center gap-2">
          <span class="text-sm text-muted">
            {{ $t("admin.posts.visitAnalysis.language") }}:
          </span>
          <button
            @click="loadData(selectedDays, 'all')"
            :class="getButtonClass(selectedLanguage === 'all')"
          >
            {{ $t("admin.posts.visitAnalysis.allLanguages") }}
          </button>
          <button
            v-for="lang in availableLanguages"
            :key="lang.code"
            @click="loadData(selectedDays, lang.code)"
            :class="getButtonClass(selectedLanguage === lang.code)"
          >
            {{ lang.nativeName || lang.name || lang.code }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm text-muted">流量类型:</span>
          <button
            v-for="option in trafficTypeOptions"
            :key="option.value"
            @click="loadData(selectedDays, selectedLanguage, option.value)"
            :class="getButtonClass(selectedTrafficType === option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="flex-1 p-6 overflow-auto">
        <div v-if="loading" class="h-64 flex items-center justify-center">
          <ArrowPathIcon class="w-6 h-6 animate-spin text-muted" />
        </div>
        <div
          v-else-if="!trendData || trendData.dates.length === 0"
          class="h-64 flex items-center justify-center"
        >
          <p class="text-sm text-muted">
            {{ $t("admin.posts.visitAnalysis.noData") }}
          </p>
        </div>
        <v-chart
          v-else
          :option="chartOption"
          class="h-64"
          autoresize
        />
        <div
          v-if="trendData"
          class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div class="rounded-lg border border-border p-3 bg-surface-muted/40">
            <p class="text-xs text-muted">总访问</p>
            <p class="text-lg font-semibold">{{ trendData.summary.totalVisits }}</p>
          </div>
          <div class="rounded-lg border border-border p-3 bg-surface-muted/40">
            <p class="text-xs text-muted">真实访问</p>
            <p class="text-lg font-semibold text-emerald-500">
              {{ trendData.summary.humanVisits }}
            </p>
          </div>
          <div class="rounded-lg border border-border p-3 bg-surface-muted/40">
            <p class="text-xs text-muted">真实IP数</p>
            <p class="text-lg font-semibold text-sky-500">
              {{ trendData.summary.humanUniqueIps }}
            </p>
          </div>
          <div class="rounded-lg border border-border p-3 bg-surface-muted/40">
            <p class="text-xs text-muted">Bot访问</p>
            <p class="text-lg font-semibold text-amber-500">
              {{ trendData.summary.botVisits }}
            </p>
          </div>
        </div>
        <div
          v-if="trendData?.summary.botVendors?.length"
          class="mt-4 rounded-lg border border-border p-3"
        >
          <p class="text-sm font-medium mb-2">Bot 厂商</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="vendor in trendData.summary.botVendors.slice(0, 10)"
              :key="vendor.vendor"
              class="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 uppercase"
            >
              {{ vendor.vendor }} · {{ vendor.count }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon, ArrowPathIcon } from "@heroicons/vue/24/outline";
import { useThemeStore } from "~/stores/theme";
import api from "~/utils/api";

interface Props {
  show: boolean;
  articleId: string;
  articleTitle?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const themeStore = useThemeStore();
const isDark = computed(() => themeStore.isDark);

// 获取天数标签
const getDaysLabel = (days: number) => {
  return t(`admin.posts.visitAnalysis.days${days}`);
};

// 获取按钮样式类
const getButtonClass = (isActive: boolean) => {
  return isActive
    ? "px-3 py-1 text-xs rounded-lg transition bg-primary-600 text-white"
    : "px-3 py-1 text-xs rounded-lg transition bg-surface-muted text-foreground hover:bg-surface-muted/70";
};

const selectedDays = ref(7);
const selectedLanguage = ref<string>("all");
const selectedTrafficType = ref<"all" | "human" | "bot">("all");
const loading = ref(false);
const trendData = ref<{
  days: number;
  dates: string[];
  counts: number[];
  humanCounts: number[];
  botCounts: number[];
  languageCode: string;
  trafficType: "all" | "human" | "bot";
  summary: {
    totalVisits: number;
    humanVisits: number;
    humanUniqueIps: number;
    botVisits: number;
    unknownVisits: number;
    botVendors: Array<{ vendor: string; count: number }>;
  };
  availableLanguages?: string[];
} | null>(null);

const trafficTypeOptions = [
  { value: "all", label: "总访问" },
  { value: "human", label: "真实访问" },
  { value: "bot", label: "Bot访问" },
] as const;

// 获取所有语言列表
const languages = ref<any[]>([]);
const availableLanguages = computed(() => {
  if (!trendData.value?.availableLanguages) {
    return languages.value;
  }
  // 只显示该文章已有的语言版本
  return languages.value.filter((lang) =>
    trendData.value?.availableLanguages?.includes(lang.code)
  );
});

// 加载语言列表
const loadLanguages = async () => {
  try {
    const response: any = await $fetch("/api/languages");
    if (response?.c === 200) {
      languages.value = Array.isArray(response.d) ? response.d : (response.d?.items || []);
    }
  } catch (error) {
    console.error("加载语言列表失败:", error);
  }
};

// 加载访问趋势数据
const loadData = async (
  days: number,
  languageCode: string,
  trafficType: "all" | "human" | "bot" = selectedTrafficType.value
) => {
  selectedDays.value = days;
  selectedLanguage.value = languageCode;
  selectedTrafficType.value = trafficType;
  loading.value = true;

  try {
    const response = await api.get<{
      days: number;
      dates: string[];
      counts: number[];
      humanCounts: number[];
      botCounts: number[];
      languageCode: string;
      trafficType: "all" | "human" | "bot";
      summary: {
        totalVisits: number;
        humanVisits: number;
        humanUniqueIps: number;
        botVisits: number;
        unknownVisits: number;
        botVendors: Array<{ vendor: string; count: number }>;
      };
      availableLanguages?: string[];
    }>(`/api/creator/articles/${props.articleId}/visitlog`, {
      query: {
        days,
        trafficType,
        ...(languageCode !== "all" ? { languageCode } : {}),
      },
    });

    trendData.value = response;
  } catch (error) {
    console.error("加载访问趋势数据失败:", error);
    trendData.value = {
      days,
      dates: [],
      counts: [],
      humanCounts: [],
      botCounts: [],
      languageCode,
      trafficType,
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
    loading.value = false;
  }
};

// ECharts 图表配置
const chartOption = computed(() => {
  if (!trendData.value || !trendData.value.dates.length) {
    return {};
  }

  const textColor = isDark.value ? "#9CA3AF" : "#6B7280";
  const gridColor = isDark.value ? "#374151" : "#E5E7EB";
  const totalLineColor = "#3B82F6";
  const humanLineColor = "#10B981";
  const botLineColor = "#F59E0B";

  // 格式化日期显示（只显示月-日，用于 X 轴）
  const formattedDates = trendData.value.dates.map((date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  // 格式化完整日期（国际通用格式 YYYY-MM-DD，用于 tooltip）
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
        if (!trendData.value || !trendData.value.dates) {
          return "";
        }
        const param = params[0];
        const dataIndex = param.dataIndex;
        const dateStr = trendData.value.dates[dataIndex];
        if (!dateStr) {
          return "";
        }
        const fullDate = formatFullDate(dateStr);
        const value = param.value;
        const seriesName =
          param.seriesName || t("admin.posts.visitAnalysis.visitCount");
        return `${fullDate}<br/>${seriesName}: ${value}`;
      },
    },
    series: [
      {
        name: "总访问",
        type: "line",
        smooth: true,
        data: trendData.value.counts,
        itemStyle: {
          color: totalLineColor,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(59, 130, 246, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(59, 130, 246, 0)",
              },
            ],
          },
        },
        symbol: "circle",
        symbolSize: 4,
      },
      {
        name: "真实访问",
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
        name: "Bot访问",
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

const handleClose = () => {
  emit("close");
};

// 监听 show 变化，当显示时加载数据
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      loadLanguages();
      loadData(7, "all", "all");
    }
  },
  { immediate: true }
);
</script>

