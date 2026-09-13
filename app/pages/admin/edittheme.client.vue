<template>
  <div class="container mx-auto p-4 max-w-6xl">
    <!-- 实时预览区域 -->
    <div
      v-if="!loading"
      class="mb-8 bg-surface text-foreground rounded-lg shadow-md p-4 border border-border"
    >
      <h2 class="text-lg font-semibold text-foreground">
        {{ $t("admin.themes.editTheme.preview.title") }}
      </h2>
      <p class="mb-4 text-muted">
        {{ $t("admin.themes.editTheme.preview.description") }}
      </p>
      <div
        class="rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700 transition-colors"
        :style="{
          backgroundColor: colors.background || '#FFFFFF',
          color: colors.foreground || '#000000',
        }"
      >
        <div class="space-y-4">
          <h3
            class="text-xl font-bold"
            :style="{ color: colors.foreground || '#000000' }"
          >
            {{ $t("admin.themes.editTheme.preview.themePreview") }}
          </h3>
          <p :style="{ color: colors.muted || '#666666' }">
            {{ $t("admin.themes.editTheme.preview.sampleText") }}
          </p>

          <!-- 按钮组：展示主色调、辅助色、强调色 -->
          <div class="space-y-2">
            <div class="flex gap-2 flex-wrap">
              <button
                class="px-4 py-2 rounded-lg text-white font-medium transition-colors"
                :style="{
                  backgroundColor:
                    typeof colors.primary === 'object'
                      ? colors.primary['500']
                      : colors.primary || '#3B82F6',
                }"
              >
                {{ $t("admin.themes.editTheme.preview.primaryButton") }}
              </button>
              <button
                class="px-4 py-2 rounded-lg text-white font-medium transition-colors"
                :style="{
                  backgroundColor:
                    typeof colors.secondary === 'object'
                      ? colors.secondary['500']
                      : colors.secondary || '#64748B',
                }"
              >
                {{ $t("admin.themes.editTheme.preview.secondaryButton") }}
              </button>
              <button
                class="px-4 py-2 rounded-lg text-white font-medium transition-colors"
                :style="{
                  backgroundColor:
                    typeof colors.accent === 'object'
                      ? colors.accent['500']
                      : colors.accent || '#6366F1',
                }"
              >
                {{ $t("admin.themes.editTheme.preview.accentButton") }}
              </button>
            </div>

            <!-- 颜色阶值展示 -->
            <div class="grid grid-cols-11 gap-1 mt-3">
              <div
                v-for="shade in [
                  '50',
                  '100',
                  '200',
                  '300',
                  '400',
                  '500',
                  '600',
                  '700',
                  '800',
                  '900',
                  '950',
                ]"
                :key="`primary-${shade}`"
                class="h-8 rounded border border-gray-300 dark:border-gray-600"
                :style="{
                  backgroundColor:
                    typeof colors.primary === 'object'
                      ? colors.primary[shade]
                      : shade === '500'
                      ? colors.primary
                      : '#3B82F6',
                }"
                :title="$t('admin.themes.editTheme.preview.primaryShade', { shade })"
              ></div>
            </div>
            <p
              class="text-xs text-center"
              :style="{ color: colors.muted || '#666666' }"
            >
              {{ $t("admin.themes.editTheme.preview.primaryScale") }}
            </p>
          </div>

          <!-- 卡片示例 -->
          <div
            class="p-4 rounded-lg"
            :style="{
              backgroundColor: colors.surface || '#FFFFFF',
              border: `1px solid ${colors.border || '#E5E7EB'}`,
            }"
          >
            <h4
              class="font-semibold mb-2"
              :style="{ color: colors.foreground || '#000000' }"
            >
              {{ $t("admin.themes.editTheme.preview.cardTitle") }}
            </h4>
            <p
              class="text-sm mb-3"
              :style="{ color: colors.muted || '#666666' }"
            >
              {{ $t("admin.themes.editTheme.preview.cardContent") }}
            </p>
            <div class="flex gap-2">
              <span
                class="px-2 py-1 rounded text-xs"
                :style="{
                  backgroundColor:
                    typeof colors.primary === 'object'
                      ? colors.primary['100']
                      : colors.primary || '#3B82F6',
                  color:
                    typeof colors.primary === 'object'
                      ? colors.primary['900']
                      : '#FFFFFF',
                }"
              >
                {{ $t("admin.themes.editTheme.preview.primaryLabel") }}
              </span>
              <span
                class="px-2 py-1 rounded text-xs"
                :style="{
                  backgroundColor:
                    typeof colors.accent === 'object'
                      ? colors.accent['100']
                      : colors.accent || '#6366F1',
                  color:
                    typeof colors.accent === 'object'
                      ? colors.accent['900']
                      : '#FFFFFF',
                }"
              >
                {{ $t("admin.themes.editTheme.preview.accentLabel") }}
              </span>
            </div>
          </div>

          <!-- 柔和表面示例 -->
          <div
            class="mt-4 p-3 rounded-lg"
            :style="{
              backgroundColor: colors.surfaceMuted || '#F5F5F5',
            }"
          >
            <p class="text-sm" :style="{ color: colors.muted || '#666666' }">
              {{ $t("admin.themes.editTheme.preview.surfaceMutedExample") }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="mb-6 border-b border-border">
      <nav class="flex space-x-1 overflow-x-auto" aria-label="Tabs">
        <button
          v-for="(step, index) in steps"
          :key="index"
          @click="currentStep = index"
          class="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
          :class="
            currentStep === index
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-muted hover:text-foreground hover:border-border'
          "
        >
          {{ step.title }}
        </button>
      </nav>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"
      ></div>
      <p class="mt-4 text-muted">{{ $t("common.loading") }}</p>
    </div>

    <!-- 消息提示 -->
    <div
      v-if="formMessage.text"
      class="mx-0 mb-6 p-3 rounded-lg text-sm"
      :class="messageClass"
    >
      {{ formMessage.text }}
    </div>

    <!-- 表单 -->
    <form v-if="!loading" @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 步骤1: 基本信息 -->
      <div
        v-if="currentStep === 0"
        class="bg-surface text-foreground rounded-lg shadow-md p-6 border border-border"
      >
        <h2 class="text-lg font-semibold text-foreground mb-4">
          {{ $t("admin.themes.editTheme.steps.basic") }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              {{ $t("admin.themes.editTheme.fields.mode") }}
              <span class="text-red-500">*</span>
            </label>
            <AppSelect
              v-model="formData.mode"
              :options="themeModeOptions"
              :placeholder="$t('admin.themes.editTheme.fields.mode')"
              :allow-clear="false"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              {{ $t("admin.themes.editTheme.fields.name") }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-border rounded-lg bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
              :placeholder="$t('admin.themes.editTheme.fields.namePlaceholder')"
            />
            <p class="text-xs text-muted mt-1">
              {{ $t("admin.themes.editTheme.fields.nameHint") }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              {{ $t("admin.themes.editTheme.fields.displayName") }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.displayName"
              type="text"
              required
              class="w-full px-3 py-2 border border-border rounded-lg bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
              :placeholder="$t('admin.themes.editTheme.fields.displayNamePlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              {{ $t("admin.themes.editTheme.fields.sortOrder") }}
            </label>
            <input
              v-model.number="formData.sortOrder"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-border rounded-lg bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div class="flex items-center">
            <input
              v-model="formData.isDefault"
              type="checkbox"
              id="isDefault"
              class="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
            />
            <label for="isDefault" class="ml-2 text-sm text-muted">
              {{ $t("admin.themes.editTheme.fields.setAsDefault") }}
            </label>
          </div>

          <div class="flex items-center">
            <input
              v-model="formData.isActive"
              type="checkbox"
              id="isActive"
              class="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
            />
            <label for="isActive" class="ml-2 text-sm text-muted">
              {{ $t("admin.themes.editTheme.fields.activate") }}
            </label>
          </div>
        </div>
      </div>

      <!-- 步骤2: 基础颜色 -->
      <div
        v-if="currentStep === 1"
        class="bg-surface text-foreground rounded-lg shadow-md p-6 border border-border"
      >
        <h2 class="text-lg font-semibold text-foreground mb-4">
          {{ $t("admin.themes.editTheme.steps.baseColors") }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.themes.editTheme.fields.background") }}
            </label>
            <AppColorPicker
              :model-value="colors.background || '#FFFFFF'"
              @update:modelValue="(v: string) => (colors.background = v)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.themes.editTheme.fields.foreground") }}
            </label>
            <AppColorPicker
              :model-value="colors.foreground || '#000000'"
              @update:modelValue="(v: string) => (colors.foreground = v)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.themes.editTheme.fields.surface") }}
            </label>
            <AppColorPicker
              :model-value="colors.surface || '#FFFFFF'"
              @update:modelValue="(v: string) => (colors.surface = v)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.themes.editTheme.fields.surfaceMuted") }}
            </label>
            <AppColorPicker
              :model-value="colors.surfaceMuted || '#F5F5F5'"
              @update:modelValue="(v: string) => (colors.surfaceMuted = v)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.themes.editTheme.fields.border") }}
            </label>
            <AppColorPicker
              :model-value="colors.border || '#E5E7EB'"
              @update:modelValue="(v: string) => (colors.border = v)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted mb-2">
              {{ $t("admin.themes.editTheme.fields.muted") }}
            </label>
            <AppColorPicker
              :model-value="colors.muted || '#6B7280'"
              @update:modelValue="(v: string) => (colors.muted = v)"
            />
          </div>
        </div>
      </div>

      <!-- 步骤3: 主色调 (Primary) -->
      <div
        v-if="currentStep === 2"
        class="bg-surface text-foreground rounded-lg shadow-md p-6 border border-border"
      >
        <h2 class="text-lg font-semibold text-foreground mb-4">
          {{ $t("admin.themes.editTheme.fields.primary") }}
        </h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="shade in colorShades"
              :key="`primary-${shade}`"
              class="space-y-2"
            >
              <label class="block text-xs font-medium text-muted text-center">
                {{ shade }}
              </label>
              <AppColorPicker
                v-model="(colors.primary as any)[shade]"
                @update:modelValue="
                  (v: string) => ((colors.primary as any)[shade] = v)
                "
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤4: 辅助色 (Secondary) -->
      <div
        v-if="currentStep === 3"
        class="bg-surface text-foreground rounded-lg shadow-md p-6 border border-border"
      >
        <h2 class="text-lg font-semibold text-foreground mb-4">
          {{ $t("admin.themes.editTheme.fields.secondary") }}
        </h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="shade in colorShades"
              :key="`secondary-${shade}`"
              class="space-y-2"
            >
              <label class="block text-xs font-medium text-muted text-center">
                {{ shade }}
              </label>
              <AppColorPicker
                v-model="(colors.secondary as any)[shade]"
                @update:modelValue="
                  (v: string) => ((colors.secondary as any)[shade] = v)
                "
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤5: 强调色 (Accent) -->
      <div
        v-if="currentStep === 4"
        class="bg-surface text-foreground rounded-lg shadow-md p-6 border border-border"
      >
        <h2 class="text-lg font-semibold text-foreground mb-4">
          {{ $t("admin.themes.editTheme.fields.accent") }}
        </h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="shade in colorShades"
              :key="`accent-${shade}`"
              class="space-y-2"
            >
              <label class="block text-xs font-medium text-muted text-center">
                {{ shade }}
              </label>
              <AppColorPicker
                v-model="(colors.accent as any)[shade]"
                @update:modelValue="
                  (v: string) => ((colors.accent as any)[shade] = v)
                "
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div
        class="flex justify-center items-center gap-3 pt-6 border-t border-border mt-6"
      >
        <button
          type="submit"
          :disabled="saving || !canSave"
          class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? $t("common.saving") : $t("common.save") }}
        </button>
        <button
          type="button"
          @click="$router.back()"
          class="px-6 py-3 bg-surface-muted text-foreground rounded-lg hover:bg-surface-muted/70 transition-colors"
        >
          {{ $t("common.back") }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ThemeColors, ThemeMode } from "~~/utils/theme-presets";
import { getDefaultColorsByMode } from "~~/utils/theme-presets";
import AppSelect from "~/components/app/Select.vue";

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "admin"],
});

const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();

const themeId = computed(() => (route.query.id as string) || undefined);
const isEdit = computed(() => !!themeId.value);

const loading = ref(true);
const saving = ref(false);

// 消息提示
const formMessage = reactive({
  text: "",
  type: "success" as "success" | "error",
});

const messageClass = computed(() =>
  formMessage.type === "success"
    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
);

const setMessage = (message: string, type: "success" | "error" = "error") => {
  formMessage.text = message;
  formMessage.type = type;
  setTimeout(() => {
    formMessage.text = "";
  }, 4000);
};

// 步骤管理
const currentStep = ref<number>(0);
const { t } = useI18n();
const steps = computed(() => [
  { title: t("admin.themes.editTheme.steps.basic"), key: "basic" },
  { title: t("admin.themes.editTheme.steps.baseColors"), key: "baseColors" },
  { title: t("admin.themes.editTheme.steps.primary"), key: "primary" },
  { title: t("admin.themes.editTheme.steps.secondary"), key: "secondary" },
  { title: t("admin.themes.editTheme.steps.accent"), key: "accent" },
]);

const themeModeOptions = computed(() => [
  { value: "light", label: t("admin.themes.editTheme.fields.light") },
  { value: "dark", label: t("admin.themes.editTheme.fields.dark") },
]);

const canSave = computed(() => {
  // 基本信息必须填写
  return (
    formData.name.trim() !== "" &&
    formData.displayName.trim() !== "" &&
    (formData.mode === "light" || formData.mode === "dark")
  );
});

const formData = reactive({
  name: "",
  displayName: "",
  mode: "light" as ThemeMode,
  isDefault: false,
  isActive: true,
  sortOrder: 0,
});

const colors = reactive<ThemeColors>(getDefaultColorsByMode("light"));

const colorShades = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

// 初始化颜色对象
const initColorScale = () => {
  if (typeof colors.primary !== "object") {
    colors.primary = {
      "50": "#EFF6FF",
      "100": "#DBEAFE",
      "200": "#BFDBFE",
      "300": "#93C5FD",
      "400": "#60A5FA",
      "500": "#3B82F6",
      "600": "#2563EB",
      "700": "#1D4ED8",
      "800": "#1E40AF",
      "900": "#1E3A8A",
      "950": "#172554",
    };
  }
  if (typeof colors.secondary !== "object") {
    colors.secondary = {
      "50": "#F8FAFC",
      "100": "#F1F5F9",
      "200": "#E2E8F0",
      "300": "#CBD5F5",
      "400": "#94A3B8",
      "500": "#64748B",
      "600": "#475569",
      "700": "#334155",
      "800": "#1E293B",
      "900": "#0F172A",
      "950": "#020617",
    };
  }
  if (typeof colors.accent !== "object") {
    colors.accent = {
      "50": "#EEF2FF",
      "100": "#E0E7FF",
      "200": "#C7D2FE",
      "300": "#A5B4FC",
      "400": "#818CF8",
      "500": "#6366F1",
      "600": "#4F46E5",
      "700": "#4338CA",
      "800": "#3730A3",
      "900": "#312E81",
      "950": "#1E1B4B",
    };
  }
};

// 加载主题数据
const loadTheme = async () => {
  if (!isEdit.value || !themeId.value) {
    loading.value = false;
    initColorScale();
    return;
  }

  loading.value = true;

  try {
    // 直接通过 ID 获取主题
    const response: any = await $fetch(`/api/admin/themes/${themeId.value}`);

    if (response?.c === 200) {
      const theme = response.d;

      if (!theme) {
        setMessage(t("common.themeNotFound"), "error");
        loading.value = false;
        initColorScale(); // 即使加载失败，也初始化表单，允许用户继续编辑
        return;
      }

      // 填充表单数据
      formData.name = theme.name;
      formData.displayName = theme.displayName;
      formData.mode = theme.mode;
      formData.isDefault = theme.isDefault;
      formData.isActive = theme.isActive;
      formData.sortOrder = theme.sortOrder || 0;

      // 解析颜色配置
      try {
        const parsedColors = JSON.parse(theme.colors);

        // 逐个赋值以确保响应式更新
        if (parsedColors.background !== undefined)
          colors.background = parsedColors.background;
        if (parsedColors.foreground !== undefined)
          colors.foreground = parsedColors.foreground;
        if (parsedColors.surface !== undefined)
          colors.surface = parsedColors.surface;
        if (parsedColors.surfaceMuted !== undefined)
          colors.surfaceMuted = parsedColors.surfaceMuted;
        if (parsedColors.border !== undefined)
          colors.border = parsedColors.border;
        if (parsedColors.muted !== undefined) colors.muted = parsedColors.muted;

        // 处理颜色阶值对象
        if (parsedColors.primary) {
          if (typeof parsedColors.primary === "object") {
            colors.primary = { ...parsedColors.primary };
          } else {
            colors.primary = parsedColors.primary;
          }
        }
        if (parsedColors.secondary) {
          if (typeof parsedColors.secondary === "object") {
            colors.secondary = { ...parsedColors.secondary };
          } else {
            colors.secondary = parsedColors.secondary;
          }
        }
        if (parsedColors.accent) {
          if (typeof parsedColors.accent === "object") {
            colors.accent = { ...parsedColors.accent };
          } else {
            colors.accent = parsedColors.accent;
          }
        }

        // 确保所有颜色阶值对象都存在
        initColorScale();
      } catch (err) {
        console.error("解析颜色配置失败:", err);
        const defaultColors = getDefaultColorsByMode(theme.mode);
        colors.background = defaultColors.background || "#FFFFFF";
        colors.foreground = defaultColors.foreground || "#000000";
        colors.surface = defaultColors.surface || "#FFFFFF";
        colors.surfaceMuted = defaultColors.surfaceMuted;
        colors.border = defaultColors.border;
        colors.muted = defaultColors.muted;
        if (defaultColors.primary) {
          colors.primary =
            typeof defaultColors.primary === "object"
              ? { ...defaultColors.primary }
              : defaultColors.primary;
        }
        if (defaultColors.secondary) {
          colors.secondary =
            typeof defaultColors.secondary === "object"
              ? { ...defaultColors.secondary }
              : defaultColors.secondary;
        }
        if (defaultColors.accent) {
          colors.accent =
            typeof defaultColors.accent === "object"
              ? { ...defaultColors.accent }
              : defaultColors.accent;
        }
        initColorScale();
      }
    } else {
      setMessage(response?.m || t("common.loadThemeFailed"), "error");
      initColorScale(); // 即使加载失败，也初始化表单，允许用户继续编辑
    }
  } catch (err: any) {
    setMessage(
      err?.data?.m || err?.message || t("common.loadThemeFailed"),
      "error"
    );
    initColorScale(); // 即使加载失败，也初始化表单，允许用户继续编辑
  } finally {
    loading.value = false;
  }
};

// 保存主题
const handleSubmit = async () => {
  saving.value = true;
  formMessage.text = "";

  try {
    const data = {
      name: formData.name,
      displayName: formData.displayName,
      mode: formData.mode,
      colors: JSON.stringify(colors),
      isDefault: formData.isDefault,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
    };

    let response: any;
    if (isEdit.value) {
      response = await $fetch(`/api/admin/themes/${themeId.value}`, {
        method: "PATCH",
        body: data,
      });
    } else {
      response = await $fetch("/api/admin/themes", {
        method: "POST",
        body: data,
      });
    }

    if (response?.c === 200) {
      const successMessage = isEdit.value
        ? t("common.themeUpdateSuccess")
        : t("common.themeCreateSuccess");
      setMessage(successMessage, "success");
    } else {
      setMessage(
        response?.m ||
          (isEdit.value ? t("common.updateFailed") : t("common.createFailed")),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(err?.data?.m || err?.message || t("common.saveFailed"), "error");
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadTheme();
});
</script>
