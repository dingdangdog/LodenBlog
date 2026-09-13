<template>
  <div class="space-y-6">
    <!-- 消息提示 -->
    <div v-if="message.text" class="mx-6 p-3 rounded-lg text-sm" :class="messageClass">
      {{ message.text }}
    </div>

    <!-- 筛选栏 -->
    <div class="bg-surface text-foreground border border-border rounded-2xl p-4">
      <div class="flex flex-wrap items-center gap-3">
        <input v-model="filters.search" type="text" :placeholder="$t('admin.tags.filters.searchPlaceholder') ||
          '搜索标签名称或 slug...'
          "
          class="w-96 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition" />
        <div class="w-40">
          <AppSelect v-model="filters.languageCode" :options="languageOptions"
            :placeholder="$t('admin.tags.filters.allLanguages') || '所有语言'" />
        </div>
        <button type="button"
          class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
          @click="loadTags()" style="display: none">
          {{ $t("admin.tags.filters.apply") || "应用" }}
        </button>
        <button type="button"
          class="p-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium"
          @click="loadTags()" :disabled="listLoading">
          <span class="flex items-center gap-2">
            <ArrowPathIcon :class="['w-4 h-4', listLoading && 'animate-spin']" />
            <!-- {{ $t("common.refresh") }} -->
          </span>
        </button>
        <button type="button"
          class="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2"
          @click="
            showTagModal = true;
          editingTag = null;
          ">
          <PlusIcon class="w-4 h-4" />
          {{ $t("admin.tags.add") }}
        </button>
      </div>
    </div>

    <!-- 标签管理 -->
    <section class="bg-surface text-foreground rounded-2xl border border-border overflow-hidden">
      <div class="max-h-[calc(100vh-300px)] overflow-y-auto">
        <!-- 加载状态 -->
        <div v-if="listLoading" class="p-8 text-center text-sm text-muted">
          <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
          <p>{{ $t("common.loading") }}</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!tagGroups.length" class="p-8 text-center text-sm text-muted">
          <p class="font-medium mb-1">
            {{ $t("common.noTags") }}
          </p>
          <p class="text-xs">
            {{ $t("admin.tags.actions.createHint") || "点击上方按钮创建标签" }}
          </p>
        </div>

        <!-- 标签分组列表 -->
        <div v-else class="divide-y divide-border">
          <div v-for="group in tagGroups" :key="group.slug" class="transition-colors hover:bg-surface-muted">
            <!-- 主行：显示slug和基本信息 -->
            <div class="flex items-center justify-between p-4 cursor-pointer" @click="toggleExpand(group.slug)">
              <div class="flex items-center gap-4 flex-1">
                <div class="flex items-center gap-2">
                  <ChevronUpIcon v-if="expandedSlugs.has(group.slug)" class="w-5 h-5 text-muted transition-transform" />
                  <ChevronDownIcon v-else class="w-5 h-5 text-muted transition-transform" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-sm font-semibold text-foreground">
                      {{ group.slug }}
                    </span>
                  </div>
                  <div class="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span v-for="tag in group.tags" :key="tag.id"
                      class="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      :title="`${getLanguageName(tag.languageCode)}: ${tag.name
                        }`">
                      {{ getLanguageDisplayName(tag.languageCode) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button type="button"
                  class="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  :disabled="deletingSlugs.has(group.slug)"
                  @click.stop="deleteTagBySlug(group.slug)">
                  <ArrowPathIcon v-if="deletingSlugs.has(group.slug)" class="w-4 h-4 animate-spin" />
                  <span v-else>{{ $t("admin.tags.actions.deleteEntireTag") || "删除整个标签" }}</span>
                </button>
              </div>
            </div>

            <!-- 展开的内容：显示所有语言版本 -->
            <div v-if="expandedSlugs.has(group.slug)" class="border-t border-border bg-surface-muted">
              <div class="p-4 space-y-2">
                <div v-for="tag in group.tags" :key="tag.id"
                  class="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
                  <div class="flex items-center gap-4 flex-1">
                    <div class="w-20">
                      <span
                        class="px-2 py-1 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700">
                        {{ tag.languageCode }}
                      </span>
                    </div>
                    <div class="flex-1">
                      <div class="font-medium text-foreground">
                        {{ tag.name }}
                      </div>
                      <div class="text-xs text-muted mt-0.5">
                        {{ getLanguageName(tag.languageCode) }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button @click.stop="handleTranslate(tag)" :disabled="translatingTags.has(tag.id)"
                      class="p-1.5 rounded text-muted hover:text-blue-600 hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      :title="$t('admin.tags.actions.translate')">
                      <LanguageIcon v-if="!translatingTags.has(tag.id)" class="w-4 h-4" />
                      <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
                    </button>
                    <button @click.stop="editTag(tag)"
                      class="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                      {{ $t("admin.tags.actions.edit") }}
                    </button>
                    <button @click.stop="deleteTag(tag)"
                      class="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                      {{ $t("admin.tags.actions.delete") }}
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
      <!-- 标签编辑模态框 -->
      <div v-if="showTagModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-surface text-foreground rounded-2xl p-6 w-full max-w-md mx-4 border border-border" @click.stop>
          <h3 class="text-xl font-bold text-foreground mb-4">
            {{
              editingTag
                ? $t("admin.tags.modal.edit")
                : $t("admin.tags.modal.add")
            }}
          </h3>

          <form @submit.prevent="saveTag" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.tags.modal.language") }}
                <span class="text-red-500">*</span>
              </label>
              <AppSelect v-model="tagForm.languageCode" :options="languageOptions" :required="true"
                :disabled="!!editingTag" :placeholder="$t('admin.tags.modal.selectLanguage')" :allow-clear="false" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.tags.modal.name") }}
                <span class="text-red-500">*</span>
              </label>
              <input v-model="tagForm.name" type="text" required
                class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.tags.modal.namePlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.tags.modal.slug") }}
                <span class="text-red-500">*</span>
              </label>
              <div class="flex gap-2">
                <input v-model="tagForm.slug" type="text" required
                  class="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
                  placeholder="url-friendly-slug" @input="tagForm.slug = $event.target.value.toLowerCase()" />
                <button type="button"
                  class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium whitespace-nowrap"
                  @click="translateToSlug" :disabled="translatingSlug || !tagForm.name || !tagForm.languageCode
                    " :title="!tagForm.name
                    ? t('admin.tags.messages.pleaseEnterTagName')
                    : !tagForm.languageCode
                      ? t('admin.tags.messages.pleaseSelectLanguage')
                      : t('admin.tags.messages.generateSlugByTranslation')
                  ">
                  <ArrowPathIcon v-if="translatingSlug" class="w-4 h-4 animate-spin" />
                  <span v-else>{{
                    $t("admin.editpost.actions.generate") || "生成"
                    }}</span>
                </button>
              </div>
              <p v-if="editingTag" class="mt-1 text-xs text-muted">
                {{ $t("admin.tags.modal.slugWarning") }}
              </p>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="submit"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {{ $t("admin.tags.actions.save") }}
              </button>
              <button type="button" @click="showTagModal = false"
                class="flex-1 px-4 py-2 bg-surface-muted text-foreground rounded-lg hover:bg-surface-muted/70 transition-colors">
                {{ $t("admin.tags.actions.cancel") }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 翻译确认对话框 -->
      <div v-if="translateDialog.show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-surface text-foreground rounded-lg shadow-xl p-6 w-full max-w-lg border border-border"
          @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("admin.tags.translateDialog.title") }}
            </h3>
            <button type="button" @click="translateDialog.show = false"
              class="text-muted hover:text-foreground transition-colors">
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
                    {{ $t("admin.tags.translateDialog.important") }}
                  </p>
                  <ul class="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                    <li>{{ $t("admin.tags.translateDialog.hint1") }}</li>
                    <li>{{ $t("admin.tags.translateDialog.hint2") }}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <p class="text-sm text-muted mb-2">
                {{ $t("admin.tags.translateDialog.sourceLanguage")
                }}<span class="font-medium">{{
                  translateDialog.sourceLanguageName
                  }}</span>
              </p>
              <p class="text-sm text-muted mb-4">
                {{ $t("admin.tags.translateDialog.tagName")
                }}<span class="font-medium">{{ translateDialog.tagName }}</span>
              </p>

              <!-- 目标语言选择 -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-muted">
                    {{ $t("admin.tags.translateDialog.targetLanguages") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <div class="flex gap-2">
                    <button type="button" @click="
                      translateDialog.targetLanguageCodes =
                      translateDialog.availableTargetLanguages.map(
                        (l) => l.code
                      )
                      " class="text-xs text-primary-600 hover:underline">
                      {{ $t("admin.tags.translateDialog.selectAll") }}
                    </button>
                    <span class="text-xs text-muted">|</span>
                    <button type="button" @click="translateDialog.targetLanguageCodes = []"
                      class="text-xs text-primary-600 hover:underline">
                      {{ $t("admin.tags.translateDialog.deselectAll") }}
                    </button>
                  </div>
                </div>
                <div class="w-full max-h-48 overflow-y-auto border border-border rounded-lg bg-surface p-2 space-y-1">
                  <label v-for="lang in translateDialog.availableTargetLanguages" :key="lang.code"
                    class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-muted cursor-pointer">
                    <input type="checkbox" :value="lang.code" v-model="translateDialog.targetLanguageCodes"
                      class="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500" />
                    <span class="text-sm text-foreground">
                      {{ lang.nativeName || lang.name }} ({{ lang.code }})
                    </span>
                  </label>
                  <p v-if="translateDialog.availableTargetLanguages.length === 0" class="text-xs text-muted px-2 py-1">
                    {{ $t("admin.tags.translateDialog.noTargetLanguages") }}
                  </p>
                </div>
                <p class="mt-1 text-xs text-muted">
                  {{ $t("admin.tags.translateDialog.targetLanguagesHint") }}
                </p>
              </div>

              <!-- 翻译渠道选择 -->
              <div>
                <label class="block text-sm font-medium text-muted mb-2">
                  {{ $t("admin.tags.translateDialog.provider") }}
                </label>
                <AppSelect v-model="translateDialog.providerId" :options="translationProviderOptions" :placeholder="$t('admin.tags.translateDialog.useDefaultProvider')
                  " />
                <p class="mt-1 text-xs text-muted">
                  {{ $t("admin.tags.translateDialog.providerHint") }}
                </p>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" @click="translateDialog.show = false"
                class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
                {{ $t("admin.tags.translateDialog.cancel") }}
              </button>
              <button type="button" @click="confirmTranslate" :disabled="translatingTags.has(translateDialog.tagId)"
                class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowPathIcon v-if="translatingTags.has(translateDialog.tagId)" class="w-4 h-4 animate-spin" />
                {{
                  translatingTags.has(translateDialog.tagId)
                    ? $t("admin.tags.translateDialog.translating")
                    : $t("admin.tags.translateDialog.confirm")
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

interface Tag {
  id: string;
  slug: string;
  name: string;
  languageCode: string;
  createdAt: string;
  updatedAt: string;
}

const allTags = ref<Tag[]>([]); // 存储所有标签数据
const languages = ref<Language[]>([]);
const listLoading = ref(false);

const filters = reactive({
  search: "",
  languageCode: "",
});

// 前端筛选后的标签列表
const filteredTags = computed(() => {
  let result = [...allTags.value];

  // 语言筛选
  if (filters.languageCode) {
    result = result.filter((tag) => tag.languageCode === filters.languageCode);
  }

  // 搜索筛选
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (tag) =>
        tag.name.toLowerCase().includes(searchLower) ||
        tag.slug.toLowerCase().includes(searchLower)
    );
  }

  return result;
});

// 按slug分组的标签
interface TagGroup {
  slug: string;
  tags: Tag[];
}

const tagGroups = computed(() => {
  const slugMap = new Map<string, Tag[]>();

  filteredTags.value.forEach((tag) => {
    if (!slugMap.has(tag.slug)) {
      slugMap.set(tag.slug, []);
    }
    slugMap.get(tag.slug)!.push(tag);
  });

  return Array.from(slugMap.entries())
    .map(([slug, tags]) => ({
      slug,
      tags: tags.sort((a, b) => a.languageCode.localeCompare(b.languageCode)),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
});

// 展开/折叠状态
const expandedSlugs = ref<Set<string>>(new Set());
const deletingSlugs = ref<Set<string>>(new Set());

const showTagModal = ref(false);
const editingTag = ref<Tag | null>(null);
const translatingSlug = ref(false);

// 翻译相关状态
const translatingTags = ref<Set<string>>(new Set());
const translateDialog = reactive({
  show: false,
  tagId: "",
  tagName: "",
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

// 语言选项
const languageOptions = computed(() => {
  return languages.value.map((lang) => ({
    value: lang.code,
    label: `${lang.nativeName || lang.name} (${lang.code})`,
  }));
});

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

const tagForm = ref({
  slug: "",
  name: "",
  languageCode: "",
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

// 切换展开/折叠
const toggleExpand = (slug: string) => {
  if (expandedSlugs.value.has(slug)) {
    expandedSlugs.value.delete(slug);
  } else {
    expandedSlugs.value.add(slug);
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

const loadTags = async () => {
  listLoading.value = true;
  try {
    // 加载所有标签，不传筛选条件，由前端筛选
    allTags.value = await api.get<Tag[]>("/api/admin/tags");
  } catch (error: any) {
    console.error("加载标签列表失败:", error);
    setMessage(error.message || t("admin.tags.messages.loadFailed"), "error");
  } finally {
    listLoading.value = false;
  }
};

// 标签管理
const editTag = (tag: Tag) => {
  editingTag.value = tag;
  tagForm.value = {
    slug: tag.slug,
    name: tag.name,
    languageCode: tag.languageCode,
  };
  showTagModal.value = true;
};

const saveTag = async () => {
  try {
    if (editingTag.value) {
      await api.patch(`/api/admin/tags/${editingTag.value.id}`, {
        ...tagForm.value,
      });
    } else {
      await api.post("/api/admin/tags", {
        ...tagForm.value,
      });
    }
    showTagModal.value = false;
    editingTag.value = null;
    tagForm.value = {
      slug: "",
      name: "",
      languageCode: "",
    };
    await loadTags();
    setMessage($t("admin.tags.messages.saveSuccess"), "success");
  } catch (error: any) {
    console.error("保存标签失败:", error);
    setMessage(error.message || $t("admin.tags.messages.saveFailed"), "error");
  }
};

const deleteTag = async (tag: Tag) => {
  const confirmed = await showConfirm({
    title: t("admin.tags.actions.delete"),
    message: t("admin.tags.messages.deleteConfirm", { name: tag.name }),
    type: "danger",
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
  });

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/api/admin/tags/${tag.id}`);
    await loadTags();
    setMessage(t("admin.tags.messages.deleteSuccess"), "success");
  } catch (error: any) {
    console.error("删除标签失败:", error);
    setMessage(error.message || t("admin.tags.messages.deleteFailed"), "error");
  }
};

// 按 slug 删除整个标签（全部语种）
const deleteTagBySlug = async (slug: string) => {
  const confirmed = await showConfirm({
    title: t("admin.tags.actions.deleteEntireTag") || "删除整个标签",
    message: t("admin.tags.messages.deleteEntireTagConfirm", { slug }) || `确定要删除标签「${slug}」的全部语种吗？此操作不可恢复。`,
    type: "danger",
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
  });

  if (!confirmed) {
    return;
  }

  deletingSlugs.value.add(slug);
  try {
    await api.delete(`/api/admin/tags/by-slug/${encodeURIComponent(slug)}`);
    await loadTags();
    setMessage(t("admin.tags.messages.deleteSuccess"), "success");
  } catch (error: any) {
    console.error("按 slug 删除标签失败:", error);
    setMessage(error?.message || t("admin.tags.messages.deleteFailed"), "error");
  } finally {
    deletingSlugs.value.delete(slug);
  }
};

// 通过翻译生成 slug
const translateToSlug = async () => {
  if (!tagForm.value.name || !tagForm.value.languageCode) {
    setMessage(
      t("admin.tags.messages.pleaseEnterTagName") +
      " " +
      t("admin.tags.messages.pleaseSelectLanguage"),
      "error"
    );
    return;
  }

  translatingSlug.value = true;
  try {
    const response: any = await $fetch("/api/creator/getslug", {
      method: "POST",
      body: {
        text: tagForm.value.name,
        from: tagForm.value.languageCode,
        to: "en", // 默认翻译为英文
      },
    });

    if (response?.c === 200 && response.d?.slug) {
      tagForm.value.slug = response.d.slug;
      setMessage(t("admin.tags.messages.translationSuccess"), "success");
    } else {
      setMessage(
        response?.m || t("admin.tags.messages.translationFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.tags.messages.translationFailed"),
      "error"
    );
  } finally {
    translatingSlug.value = false;
  }
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
const handleTranslate = (tag: Tag) => {
  if (!tag.languageCode) {
    return;
  }

  const lang = languages.value.find((l) => l.code === tag.languageCode);
  translateDialog.tagId = tag.id;
  translateDialog.tagName = tag.name;
  translateDialog.sourceLanguageCode = tag.languageCode;
  translateDialog.sourceLanguageName = lang
    ? `${lang.nativeName || lang.name} (${lang.code})`
    : tag.languageCode;
  translateDialog.providerId = ""; // 重置为默认

  // 计算可用的目标语言：排除源语言本身
  translateDialog.availableTargetLanguages = languages.value.filter(
    (l) => l.code !== tag.languageCode
  );

  // 默认选中所有可用语言
  translateDialog.targetLanguageCodes =
    translateDialog.availableTargetLanguages.map((l) => l.code);

  translateDialog.show = true;
};

// 确认翻译
const confirmTranslate = async () => {
  const tagId = translateDialog.tagId;
  const sourceLanguageCode = translateDialog.sourceLanguageCode;

  if (!tagId || !sourceLanguageCode) {
    return;
  }

  // 验证是否选择了目标语言
  if (
    !translateDialog.targetLanguageCodes ||
    translateDialog.targetLanguageCodes.length === 0
  ) {
    setMessage(t("admin.tags.messages.selectTargetLanguages"), "error");
    return;
  }

  translatingTags.value.add(tagId);

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
      `/api/admin/tags/${tagId}/translate-all`,
      {
        method: "POST",
        body,
      }
    );

    if (response?.c === 200) {
      translateDialog.show = false;
      setMessage(t("admin.tags.messages.translateSuccess"), "success");
      // 刷新列表
      await loadTags();
    } else {
      setMessage(
        response?.m || t("admin.tags.messages.translateFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.tags.messages.translateFailed"),
      "error"
    );
  } finally {
    translatingTags.value.delete(tagId);
  }
};

onMounted(() => {
  loadLanguages();
  loadTags();
  loadTranslationProviders();
});
</script>
