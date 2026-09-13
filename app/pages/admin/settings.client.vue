<template>
  <div class="space-y-6">
    <!-- 设置表单 -->
    <div class="bg-surface text-foreground border border-border rounded-2xl overflow-hidden">
      <!-- 选项卡导航 -->
      <div class="border-b border-border overflow-x-auto">
        <nav class="flex -mb-px min-w-0">
          <button v-for="tab in TABS" :key="tab.key" type="button" @click="setTab(tab.key)"
            class="flex items-center flex-shrink-0 px-3 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
            :class="activeTab === tab.key
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-muted hover:text-foreground hover:border-border'
              ">
            <component :is="tab.icon" class="w-5 h-5 flex-shrink-0" />
            <span class="ml-2" :class="activeTab === tab.key ? 'inline' : 'hidden sm:inline'">
              {{ $t(tab.label) }}
            </span>
          </button>
        </nav>
      </div>

      <!-- 表单内容：主题管理需要更高密度，单独收紧内边距 -->
      <div :class="activeTab === 'themes' ? 'p-2 md:p-3' : 'p-2 md:p-6'">
        <!-- 站点设置选项卡 -->
        <SystemSiteSettings v-show="activeTab === 'site'" />

        <!-- 翻译配置选项卡（包含语言设置） -->
        <SystemTranslationSettings v-show="activeTab === 'translation'" />

        <!-- AI 服务商配置 -->
        <SystemAiSettings v-show="activeTab === 'ai'" />

        <!-- 主题管理选项卡 -->
        <SystemThemesSettings v-show="activeTab === 'themes'" />

        <!-- 语言管理选项卡 -->
        <SystemLanguagesSettings v-show="activeTab === 'languages'" />

        <!-- 自定义代码选项卡 -->
        <SystemCustomSettings v-show="activeTab === 'custom'" />

        <!-- 系统配置选项卡 -->
        <SystemConfig v-show="activeTab === 'config'" />

        <!-- 数据导入选项卡 -->
        <SystemImportSettings v-show="activeTab === 'import'" />

        <!-- 信息页管理选项卡 -->
        <SystemInfoSettings v-show="activeTab === 'info'" />

        <!-- 友链管理选项卡 -->
        <SystemLinksSettings v-show="activeTab === 'links'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  InformationCircleIcon,
  CodeBracketIcon,
  LanguageIcon,
  ArrowDownTrayIcon,
  CogIcon,
  DocumentTextIcon,
  LinkIcon,
  SwatchIcon,
  GlobeAltIcon,
  SparklesIcon,
} from "@heroicons/vue/24/outline";

const TAB_OPTIONS = [
  "site",
  "translation",
  "ai",
  "themes",
  "languages",
  "custom",
  "config",
  "import",
  "info",
  "links",
] as const;
type TabKey = (typeof TAB_OPTIONS)[number];

const TABS: { key: TabKey; icon: typeof InformationCircleIcon; label: string }[] = [
  { key: "translation", icon: LanguageIcon, label: "admin.settings.tabs.translation" },
  { key: "ai", icon: SparklesIcon, label: "admin.settings.tabs.ai" },
  { key: "themes", icon: SwatchIcon, label: "admin.settings.tabs.themes" },
  { key: "languages", icon: GlobeAltIcon, label: "admin.settings.tabs.languages" },
  { key: "config", icon: CogIcon, label: "admin.settings.tabs.system" },
  { key: "site", icon: InformationCircleIcon, label: "admin.settings.tabs.site" },
  { key: "info", icon: DocumentTextIcon, label: "admin.settings.tabs.info" },
  { key: "custom", icon: CodeBracketIcon, label: "admin.settings.tabs.custom" },
  { key: "links", icon: LinkIcon, label: "admin.settings.tabs.links" },
  { key: "import", icon: ArrowDownTrayIcon, label: "admin.settings.tabs.import" },
];

const DEFAULT_TAB: TabKey = "translation";

function isValidTab(value: unknown): value is TabKey {
  return typeof value === "string" && TAB_OPTIONS.includes(value as TabKey);
}

function parseTabQuery(value: unknown): TabKey | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return isValidTab(raw) ? raw : null;
}

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "admin"],
});

const route = useRoute();
const router = useRouter();

const activeTab = ref<TabKey>(parseTabQuery(route.query.tab) ?? DEFAULT_TAB);

function replaceUrlTab(tab: TabKey) {
  if (parseTabQuery(route.query.tab) === tab) {
    return;
  }
  router.replace({
    query: { ...route.query, tab },
  });
}

// 从 URL 回显 tab；无参数或无效值时回退默认 tab 并写入 URL
function syncTabFromUrl() {
  const tabFromUrl = parseTabQuery(route.query.tab);
  if (tabFromUrl) {
    activeTab.value = tabFromUrl;
    return;
  }
  activeTab.value = DEFAULT_TAB;
  replaceUrlTab(DEFAULT_TAB);
}

// 切换 tab 时更新 URL（支持刷新、分享与浏览器前进后退）
function setTab(tab: TabKey) {
  activeTab.value = tab;
  replaceUrlTab(tab);
}

onMounted(syncTabFromUrl);
watch(() => route.query.tab, syncTabFromUrl);
</script>
