<template>
  <div class="space-y-6">
    <!-- 消息提示 -->
    <div v-if="message.text" class="mx-6 p-3 rounded-lg text-sm" :class="messageClass">
      {{ message.text }}
    </div>

    <!-- 筛选栏 -->
    <div class="bg-surface border border-border rounded-2xl p-4">
      <div class="flex flex-wrap items-center gap-3">
        <input v-model="filters.search" type="text" :placeholder="$t('admin.categories.filters.searchPlaceholder') ||
          '搜索分类名称或 slug...'
          "
          class="w-96 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition" />
        <div class="w-40">
          <AppSelect v-model="filters.languageCode" :options="languageOptions" :placeholder="$t('admin.categories.filters.allLanguages') || '所有语言'
            " />
        </div>
        <button type="button"
          class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
          @click="loadCategories()" style="display: none">
          {{ $t("admin.categories.filters.apply") || "应用" }}
        </button>
        <button type="button"
          class="p-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
          @click="loadCategories()" :disabled="listLoading">
          <span class="flex items-center gap-2">
            <ArrowPathIcon :class="['w-4 h-4', listLoading && 'animate-spin']" />
            <!-- {{ $t("common.refresh") }} -->
          </span>
        </button>
        <button type="button"
          class="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2"
          @click="
            showCategoryModal = true;
          editingCategory = null;
          ">
          <PlusIcon class="w-4 h-4" />
          {{ $t("admin.categories.add") }}
        </button>
      </div>
    </div>

    <!-- 分类管理 -->
    <section class="bg-surface rounded-2xl border border-border overflow-hidden">
      <div class="max-h-[calc(100vh-300px)] overflow-y-auto">
        <!-- 加载状态 -->
        <div v-if="listLoading" class="p-8 text-center text-sm text-muted">
          <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
          <p>{{ $t("common.loading") }}</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!categoryGroups.length" class="p-8 text-center text-sm text-muted">
          <p class="font-medium mb-1">
            {{ $t("common.noCategories") }}
          </p>
          <p class="text-xs">
            {{
              $t("admin.categories.actions.createHint") ||
              "点击上方按钮创建分类"
            }}
          </p>
        </div>

        <!-- 分类分组列表 -->
        <div v-else class="divide-y divide-border">
          <div v-for="group in categoryGroups" :key="group.slug" class="transition-colors hover:bg-surface-muted">
            <!-- 主行：显示slug和基本信息 -->
            <div class="flex items-center justify-between p-4 cursor-pointer" @click="toggleExpand(group.slug)">
              <div class="flex items-center gap-4 flex-1">
                <div class="flex items-center gap-2">
                  <ChevronUpIcon v-if="expandedSlugs.has(group.slug)"
                    class="w-5 h-5 text-gray-400 transition-transform" />
                  <ChevronDownIcon v-else class="w-5 h-5 text-gray-400 transition-transform" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-sm font-semibold text-foreground">
                      {{ group.slug }}
                    </span>
                  </div>
                  <div class="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span v-for="category in group.categories" :key="category.id"
                      class="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      :title="`${getLanguageName(category.languageCode)}: ${category.name
                        }`">
                      {{ getLanguageDisplayName(category.languageCode) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 展开的内容：显示所有语言版本 -->
            <div v-if="expandedSlugs.has(group.slug)" class="border-t border-border bg-surface-muted">
              <div class="p-4 space-y-2">
                <div v-for="category in group.categories" :key="category.id"
                  class="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
                  <div class="flex items-center gap-4 flex-1">
                    <div class="w-20">
                      <span
                        class="px-2 py-1 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700">
                        {{ category.languageCode }}
                      </span>
                    </div>
                    <div class="flex-1">
                      <div class="font-medium text-foreground">
                        {{ category.name }}
                      </div>
                      <div class="text-xs text-muted mt-0.5 flex items-center gap-3">
                        <span>{{
                          getLanguageName(category.languageCode)
                        }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button @click.stop="handleTranslate(category)" :disabled="translatingCategories.has(category.id)"
                      class="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      :title="$t('admin.categories.actions.translate')">
                      <LanguageIcon v-if="!translatingCategories.has(category.id)" class="w-4 h-4" />
                      <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
                    </button>
                    <button @click.stop="editCategory(category)"
                      class="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                      {{ $t("admin.categories.actions.edit") }}
                    </button>
                    <button @click.stop="deleteCategory(category)"
                      class="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                      {{ $t("admin.categories.actions.delete") }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <!-- 分类编辑模态框 -->
      <div v-if="showCategoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
          class="bg-surface text-foreground rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-border"
          @click.stop>
          <h3 class="text-xl font-bold text-foreground mb-4">
            {{
              editingCategory
                ? $t("admin.categories.modal.edit")
                : $t("admin.categories.modal.add")
            }}
          </h3>

          <form @submit.prevent="saveCategory" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t("admin.categories.modal.language") }}
                <span class="text-red-500">*</span>
              </label>
              <AppSelect v-model="categoryForm.languageCode" :options="languageOptions" :required="true"
                :disabled="!!editingCategory" :placeholder="$t('admin.categories.modal.selectLanguage')"
                :allow-clear="false" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t("admin.categories.modal.name") }}
                <span class="text-red-500">*</span>
              </label>
              <input v-model="categoryForm.name" type="text" required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                :placeholder="$t('admin.categories.modal.namePlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t("admin.categories.modal.slug") }}
                <span class="text-red-500">*</span>
              </label>
              <div class="flex gap-2">
                <input v-model="categoryForm.slug" type="text" required
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="url-friendly-slug" @input="categoryForm.slug = $event.target.value.toLowerCase()" />
                <button type="button"
                  class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap"
                  @click="translateToSlug" :disabled="translatingSlug ||
                    !categoryForm.name ||
                    !categoryForm.languageCode
                    " :title="!categoryForm.name
                      ? t('admin.categories.messages.pleaseEnterCategoryName')
                      : !categoryForm.languageCode
                        ? t('admin.categories.messages.pleaseSelectLanguage')
                        : t('admin.categories.messages.generateSlugByTranslation')
                      ">
                  <ArrowPathIcon v-if="translatingSlug" class="w-4 h-4 animate-spin" />
                  <span v-else>{{
                    $t("admin.editpost.actions.generate") || "生成"
                  }}</span>
                </button>
              </div>
              <p v-if="editingCategory" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ $t("admin.categories.modal.slugWarning") }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t("admin.categories.modal.sortOrder") }}
              </label>
              <input v-model.number="categoryForm.sortOrder" type="number"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            <div class="flex gap-3 pt-4">
              <button type="submit"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {{ $t("admin.categories.actions.save") }}
              </button>
              <button type="button" @click="showCategoryModal = false"
                class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                {{ $t("admin.categories.actions.cancel") }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 翻译确认对话框 -->
      <div v-if="translateDialog.show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t("admin.categories.translateDialog.title") }}
            </h3>
            <button type="button" @click="translateDialog.show = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <div class="space-y-4">
            <div
              class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    {{ $t("admin.categories.translateDialog.important") }}
                  </p>
                  <ul class="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                    <li>{{ $t("admin.categories.translateDialog.hint1") }}</li>
                    <li>{{ $t("admin.categories.translateDialog.hint2") }}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {{ $t("admin.categories.translateDialog.sourceLanguage")
                }}<span class="font-medium">{{
                  translateDialog.sourceLanguageName
                }}</span>
              </p>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {{ $t("admin.categories.translateDialog.categoryName")
                }}<span class="font-medium">{{
                  translateDialog.categoryName
                }}</span>
              </p>

              <!-- 目标语言选择 -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ $t("admin.categories.translateDialog.targetLanguages") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <div class="flex gap-2">
                    <button type="button" @click="
                      translateDialog.targetLanguageCodes =
                      translateDialog.availableTargetLanguages.map(
                        (l) => l.code
                      )
                      " class="text-xs text-primary-600 hover:underline">
                      {{ $t("admin.categories.translateDialog.selectAll") }}
                    </button>
                    <span class="text-xs text-gray-400">|</span>
                    <button type="button" @click="translateDialog.targetLanguageCodes = []"
                      class="text-xs text-primary-600 hover:underline">
                      {{ $t("admin.categories.translateDialog.deselectAll") }}
                    </button>
                  </div>
                </div>
                <div
                  class="w-full max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 p-2 space-y-1">
                  <label v-for="lang in translateDialog.availableTargetLanguages" :key="lang.code"
                    class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                    <input type="checkbox" :value="lang.code" v-model="translateDialog.targetLanguageCodes"
                      class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                    <span class="text-sm text-gray-900 dark:text-white">
                      {{ lang.nativeName || lang.name }} ({{ lang.code }})
                    </span>
                  </label>
                  <p v-if="translateDialog.availableTargetLanguages.length === 0"
                    class="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                    {{ $t("admin.categories.translateDialog.noTargetLanguages") }}
                  </p>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ $t("admin.categories.translateDialog.targetLanguagesHint") }}
                </p>
              </div>

              <!-- 翻译渠道选择 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t("admin.categories.translateDialog.provider") }}
                </label>
                <AppSelect v-model="translateDialog.providerId" :options="translationProviderOptions" :placeholder="$t('admin.categories.translateDialog.useDefaultProvider')
                  " />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ $t("admin.categories.translateDialog.providerHint") }}
                </p>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" @click="translateDialog.show = false"
                class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                {{ $t("admin.categories.translateDialog.cancel") }}
              </button>
              <button type="button" @click="confirmTranslate"
                :disabled="translatingCategories.has(translateDialog.categoryId)"
                class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowPathIcon v-if="translatingCategories.has(translateDialog.categoryId)"
                  class="w-4 h-4 animate-spin" />
                {{
                  translatingCategories.has(translateDialog.categoryId)
                    ? $t("admin.categories.translateDialog.translating")
                    : $t("admin.categories.translateDialog.confirm")
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { api } from "~/utils/api";
import { useConfirm } from "~/composables/useConfirm";
import {
  LanguageIcon,
  ArrowPathIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/vue/24/outline";

const { t } = useI18n();
const { showConfirm } = useConfirm();

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "admin"],
});

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  languageCode: string;
  createdAt: string;
  updatedAt: string;
}

const allCategories = ref<Category[]>([]); // 存储所有分类数据
const languages = ref<Language[]>([]);
const listLoading = ref(false);

const filters = reactive({
  search: "",
  languageCode: "",
});

// 前端筛选后的分类列表
const filteredCategories = computed(() => {
  let result = [...allCategories.value];

  // 语言筛选
  if (filters.languageCode) {
    result = result.filter(
      (category) => category.languageCode === filters.languageCode
    );
  }

  // 搜索筛选
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (category) =>
        category.name.toLowerCase().includes(searchLower) ||
        category.slug.toLowerCase().includes(searchLower)
    );
  }

  return result;
});

// 按slug分组的分类
interface CategoryGroup {
  slug: string;
  categories: Category[];
}

const categoryGroups = computed(() => {
  const slugMap = new Map<string, Category[]>();

  filteredCategories.value.forEach((category) => {
    if (!slugMap.has(category.slug)) {
      slugMap.set(category.slug, []);
    }
    slugMap.get(category.slug)!.push(category);
  });

  return Array.from(slugMap.entries())
    .map(([slug, categories]) => ({
      slug,
      categories: categories.sort((a, b) => {
        // 先按sortOrder排序，再按languageCode排序
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.languageCode.localeCompare(b.languageCode);
      }),
    }))
    .sort((a, b) => {
      // 按第一个分类的sortOrder排序，再按slug排序
      const aSort = a.categories[0]?.sortOrder ?? 0;
      const bSort = b.categories[0]?.sortOrder ?? 0;
      if (aSort !== bSort) {
        return aSort - bSort;
      }
      return a.slug.localeCompare(b.slug);
    });
});

// 展开/折叠状态
const expandedSlugs = ref<Set<string>>(new Set());

const showCategoryModal = ref(false);
const editingCategory = ref<Category | null>(null);
const translatingSlug = ref(false);

// 翻译相关状态
const translatingCategories = ref<Set<string>>(new Set());
const translateDialog = reactive({
  show: false,
  categoryId: "",
  categoryName: "",
  sourceLanguageCode: "",
  sourceLanguageName: "",
  providerId: "", // 选中的翻译服务商ID，空字符串表示使用系统默认
  targetLanguageCodes: [] as string[], // 选中的目标语言代码列表
  availableTargetLanguages: [] as Language[], // 可用的目标语言列表（排除源语言）
});

// 翻译服务商列表
interface TranslationProvider {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  priority: number;
}

const translationProviders = ref<TranslationProvider[]>([]);

const message = reactive({
  text: "",
  type: "success" as "success" | "error",
});

const messageClass = computed(() =>
  message.type === "success"
    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
);

const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.text = text;
  message.type = type;
  setTimeout(() => {
    message.text = "";
  }, 4000);
};

const categoryForm = ref({
  slug: "",
  name: "",
  sortOrder: 0,
  languageCode: "",
});

// 可用的父分类列表（排除自己，且同语言）
const availableParentCategories = computed(() => {
  if (!categoryForm.value.languageCode) return [];
  return allCategories.value.filter(
    (cat) =>
      cat.languageCode === categoryForm.value.languageCode &&
      cat.id !== editingCategory.value?.id
  );
});

// 切换展开/折叠
const toggleExpand = (slug: string) => {
  if (expandedSlugs.value.has(slug)) {
    expandedSlugs.value.delete(slug);
  } else {
    expandedSlugs.value.add(slug);
  }
};

// 语言选项
const languageOptions = computed(() => {
  return languages.value.map((lang) => ({
    value: lang.code,
    label: `${lang.nativeName || lang.name} (${lang.code})`,
  }));
});

// 父分类选项
const parentCategoryOptions = computed(() => {
  return availableParentCategories.value.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));
});

// 获取语言名称（用于显示）
const getLanguageName = (code: string) => {
  const lang = languages.value.find((l) => l.code === code);
  return lang ? `${lang.nativeName} (${lang.code})` : code;
};

// 获取语言显示名称（简短版本，用于标签显示）
const getLanguageDisplayName = (code: string) => {
  const lang = languages.value.find((l) => l.code === code);
  return lang ? lang.nativeName || lang.name || code : code;
};

// 获取分类名称
const getCategoryName = (id: string | null) => {
  if (!id) return null;
  const cat = allCategories.value.find((c: Category) => c.id === id);
  return cat ? cat.name : null;
};

// 翻译提供商选项
const translationProviderOptions = computed(() => {
  return [
    ...translationProviders.value.map((provider) => ({
      value: provider.id,
      label: `${provider.name} (${provider.provider})`,
    })),
  ];
});

// 加载翻译服务商列表
const loadTranslationProviders = async () => {
  try {
    const response: any = await $fetch("/api/creator/translations");
    if (response?.c === 200) {
      // 只显示启用的服务商，按优先级排序
      translationProviders.value = (response.d || [])
        .filter((p: TranslationProvider) => p.isActive)
        .sort(
          (a: TranslationProvider, b: TranslationProvider) =>
            b.priority - a.priority
        );
    }
  } catch (error) {
    console.error("加载翻译服务商列表失败:", error);
  }
};

// 处理翻译
const handleTranslate = (category: Category) => {
  if (!category.languageCode) {
    return;
  }

  const lang = languages.value.find((l) => l.code === category.languageCode);
  translateDialog.categoryId = category.id;
  translateDialog.categoryName = category.name;
  translateDialog.sourceLanguageCode = category.languageCode;
  translateDialog.sourceLanguageName = lang
    ? `${lang.nativeName || lang.name} (${lang.code})`
    : category.languageCode;
  translateDialog.providerId = ""; // 重置为默认

  // 计算可用的目标语言：排除源语言本身
  translateDialog.availableTargetLanguages = languages.value.filter(
    (l) => l.code !== category.languageCode
  );

  // 默认选中所有可用语言
  translateDialog.targetLanguageCodes =
    translateDialog.availableTargetLanguages.map((l) => l.code);

  translateDialog.show = true;
};

// 确认翻译
const confirmTranslate = async () => {
  const categoryId = translateDialog.categoryId;
  const sourceLanguageCode = translateDialog.sourceLanguageCode;

  if (!categoryId || !sourceLanguageCode) {
    return;
  }

  // 验证是否选择了目标语言
  if (
    !translateDialog.targetLanguageCodes ||
    translateDialog.targetLanguageCodes.length === 0
  ) {
    setMessage(t("admin.categories.messages.selectTargetLanguages"), "error");
    return;
  }

  translatingCategories.value.add(categoryId);

  try {
    const body: any = {
      sourceLanguageCode,
      targetLanguageCodes: translateDialog.targetLanguageCodes,
    };

    // 如果选择了翻译服务商，传递providerId
    if (translateDialog.providerId) {
      body.providerId = translateDialog.providerId;
    }

    const response: any = await $fetch(
      `/api/admin/category/${categoryId}/translate-all`,
      {
        method: "POST",
        body,
      }
    );

    if (response?.c === 200) {
      translateDialog.show = false;
      setMessage(t("admin.categories.messages.translateSuccess"), "success");
      // 刷新列表
      await loadCategories();
    } else {
      setMessage(
        response?.m || t("admin.categories.messages.translateFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.categories.messages.translateFailed"),
      "error"
    );
  } finally {
    translatingCategories.value.delete(categoryId);
  }
};

// 加载数据
const loadLanguages = async () => {
  try {
    languages.value = await api.get<Language[]>("/api/admin/languages");
  } catch (error: any) {
    console.error("加载语言列表失败:", error);
  }
};

const loadCategories = async () => {
  listLoading.value = true;
  try {
    // 加载所有分类，不传筛选条件，由前端筛选
    allCategories.value = await api.get<Category[]>("/api/admin/category");
  } catch (error: any) {
    console.error("加载分类列表失败:", error);
    setMessage(
      error.message || t("admin.categories.messages.loadFailed"),
      "error"
    );
  } finally {
    listLoading.value = false;
  }
};

// 分类管理
const editCategory = (category: Category) => {
  editingCategory.value = category;
  categoryForm.value = {
    slug: category.slug,
    name: category.name,
    sortOrder: category.sortOrder,
    languageCode: category.languageCode,
  };
  showCategoryModal.value = true;
};

const saveCategory = async () => {
  try {
    if (editingCategory.value) {
      await api.patch(`/api/admin/category/${editingCategory.value.id}`, {
        ...categoryForm.value,
      });
    } else {
      await api.post("/api/admin/category", {
        ...categoryForm.value,
      });
    }
    showCategoryModal.value = false;
    editingCategory.value = null;
    categoryForm.value = {
      slug: "",
      name: "",
      sortOrder: 0,
      languageCode: "",
    };
    await loadCategories();
    setMessage(t("admin.categories.messages.saveSuccess"), "success");
  } catch (error: any) {
    console.error("保存分类失败:", error);
    setMessage(
      error.message || t("admin.categories.messages.saveFailed"),
      "error"
    );
  }
};

const deleteCategory = async (category: Category) => {
  const confirmed = await showConfirm({
    title: t("admin.categories.actions.delete"),
    message: t("admin.categories.messages.deleteConfirm", { name: category.name }),
    type: "danger",
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
  });

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/api/admin/category/${category.id}`);
    await loadCategories();
    setMessage(t("admin.categories.messages.deleteSuccess"), "success");
  } catch (error: any) {
    console.error("删除分类失败:", error);
    setMessage(
      error.message || t("admin.categories.messages.deleteFailed"),
      "error"
    );
  }
};

// 通过翻译生成 slug
const translateToSlug = async () => {
  if (!categoryForm.value.name || !categoryForm.value.languageCode) {
    setMessage(
      t("admin.categories.messages.pleaseEnterCategoryName") +
      " " +
      t("admin.categories.messages.pleaseSelectLanguage"),
      "error"
    );
    return;
  }

  translatingSlug.value = true;
  try {
    const response: any = await $fetch("/api/creator/getslug", {
      method: "POST",
      body: {
        text: categoryForm.value.name,
        from: categoryForm.value.languageCode,
        to: "en", // 默认翻译为英文
      },
    });

    if (response?.c === 200 && response.d?.slug) {
      categoryForm.value.slug = response.d.slug;
      setMessage(t("admin.categories.messages.translationSuccess"), "success");
    } else {
      setMessage(
        response?.m || t("admin.categories.messages.translationFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.categories.messages.translationFailed"),
      "error"
    );
  } finally {
    translatingSlug.value = false;
  }
};

onMounted(() => {
  loadLanguages();
  loadCategories();
  loadTranslationProviders();
});
</script>
