<template>
  <div class="space-y-8">
    <!-- 消息提示 -->
    <div
      v-if="message.text"
      class="mx-6 p-3 rounded-lg text-sm"
      :class="messageClass"
    >
      {{ message.text }}
    </div>

    <!-- 语言管理 -->
    <section
      class="bg-surface text-foreground rounded-2xl border border-border p-6"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t("admin.languages.title") }}
        </h2>
        <button
          @click="
            showLanguageModal = true;
            editingLanguage = null;
          "
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {{ $t("admin.languages.add") }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-muted"
              >
                {{ $t("admin.languages.table.code") }}
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-muted"
              >
                {{ $t("admin.languages.table.name") }}
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-muted"
              >
                {{ $t("admin.languages.table.nativeName") }}
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-muted"
              >
                {{ $t("admin.languages.table.sortOrder") }}
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-muted"
              >
                {{ $t("admin.languages.table.status") }}
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-muted"
              >
                {{ $t("admin.languages.table.default") }}
              </th>
              <th
                class="text-right py-3 px-4 text-sm font-semibold text-muted"
              >
                {{ $t("admin.languages.table.actions") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="lang in languages"
              :key="lang.id"
              class="border-b border-border hover:bg-surface-muted"
            >
              <td class="py-3 px-4 text-sm text-foreground">
                {{ lang.code }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ lang.name }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ lang.nativeName }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground">
                {{ lang.sortOrder }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    lang.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-surface-muted text-muted',
                  ]"
                >
                  {{
                    lang.isActive
                      ? $t("admin.languages.status.enabled")
                      : $t("admin.languages.status.disabled")
                  }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span
                  v-if="lang.isDefault"
                  class="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {{ $t("admin.languages.table.default") }}
                </span>
                <span v-else class="text-muted text-xs">-</span>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-2 flex-wrap">
                  <button
                    v-if="lang.isActive"
                    @click="toggleActive(lang)"
                    :disabled="lang.isDefault"
                    :class="[
                      'px-3 py-1 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
                      lang.isDefault && 'opacity-50 cursor-not-allowed',
                    ]"
                  >
                    {{ $t("admin.languages.actions.disable") }}
                  </button>
                  <button
                    v-else
                    @click="toggleActive(lang)"
                    class="px-3 py-1 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    {{ $t("admin.languages.actions.enable") }}
                  </button>
                  <button
                    @click="editLanguage(lang)"
                    class="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {{ $t("admin.languages.actions.edit") }}
                  </button>
                  <button
                    @click="deleteLanguage(lang)"
                    :disabled="lang.isDefault"
                    :class="[
                      'px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
                      lang.isDefault && 'opacity-50 cursor-not-allowed',
                    ]"
                  >
                    {{ $t("admin.languages.actions.delete") }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 语言编辑模态框 -->
    <Teleport to="body">
      <div
        v-if="showLanguageModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div
          class="bg-surface text-foreground rounded-2xl p-6 w-full max-w-md mx-4 border border-border"
          @click.stop
        >
          <h3 class="text-xl font-bold text-foreground mb-4">
            {{
              editingLanguage
                ? $t("admin.languages.edit")
                : $t("admin.languages.add")
            }}
          </h3>

          <form @submit.prevent="saveLanguage" class="space-y-4">
          <div>
            <label
              class="block text-sm font-medium text-muted mb-1"
            >
              {{ $t("admin.languages.form.code") }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="languageForm.code"
              type="text"
              required
              :disabled="!!editingLanguage"
              class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
              :placeholder="$t('admin.languages.form.codePlaceholder')"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-muted mb-1"
            >
              {{ $t("admin.languages.form.name") }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="languageForm.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
              :placeholder="$t('admin.languages.form.namePlaceholder')"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-muted mb-1"
            >
              {{ $t("admin.languages.form.nativeName") }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="languageForm.nativeName"
              type="text"
              required
              class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
              :placeholder="$t('admin.languages.form.nativeNamePlaceholder')"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-muted mb-1"
            >
              {{ $t("admin.languages.form.flag") }}
            </label>
            <input
              v-model="languageForm.flag"
              type="text"
              class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
              :placeholder="$t('admin.languages.form.flagPlaceholder')"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-muted mb-1"
            >
              {{ $t("admin.languages.form.sortOrder") }}
            </label>
            <input
              v-model.number="languageForm.sortOrder"
              type="number"
              class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground"
            />
          </div>

          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <input
                v-model="languageForm.isActive"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded"
              />
              <span class="text-sm text-muted">{{
                $t("admin.languages.form.isActive")
              }}</span>
            </label>

            <label class="flex items-center gap-2">
              <input
                v-model="languageForm.isDefault"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded"
              />
              <span class="text-sm text-muted">{{
                $t("admin.languages.form.isDefault")
              }}</span>
            </label>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ $t("admin.languages.actions.save") }}
            </button>
            <button
              type="button"
              @click="showLanguageModal = false"
              class="flex-1 px-4 py-2 bg-surface-muted text-foreground rounded-lg hover:bg-surface-muted/70 transition-colors"
            >
              {{ $t("admin.languages.actions.cancel") }}
            </button>
          </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { api } from "~/utils/api";
import { useConfirm } from "~/composables/useConfirm";

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const languages = ref<Language[]>([]);

const showLanguageModal = ref(false);
const editingLanguage = ref<Language | null>(null);

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

const languageForm = ref({
  code: "",
  name: "",
  nativeName: "",
  flag: "",
  isActive: true,
  isDefault: false,
  sortOrder: 0,
});

const loadLanguages = async () => {
  try {
    languages.value = await api.get<Language[]>("/api/admin/languages");
  } catch (error: any) {
    console.error(t("admin.languages.actions.loadFailed"), error);
    setMessage(
      error.message || t("admin.languages.actions.loadFailed"),
      "error"
    );
  }
};

const editLanguage = (lang: Language) => {
  editingLanguage.value = lang;
  languageForm.value = {
    code: lang.code,
    name: lang.name,
    nativeName: lang.nativeName,
    flag: lang.flag || "",
    isActive: lang.isActive,
    isDefault: lang.isDefault,
    sortOrder: lang.sortOrder,
  };
  showLanguageModal.value = true;
};

const saveLanguage = async () => {
  try {
    if (editingLanguage.value) {
      await api.patch(`/api/admin/languages/${editingLanguage.value.id}`, {
        ...languageForm.value,
        flag: languageForm.value.flag || null,
      });
    } else {
      await api.post("/api/admin/languages", {
        ...languageForm.value,
        flag: languageForm.value.flag || null,
      });
    }
    showLanguageModal.value = false;
    editingLanguage.value = null;
    languageForm.value = {
      code: "",
      name: "",
      nativeName: "",
      flag: "",
      isActive: true,
      isDefault: false,
      sortOrder: 0,
    };
    await loadLanguages();
    setMessage(t("admin.languages.actions.saveSuccess"), "success");
  } catch (error: any) {
    console.error(t("admin.languages.actions.saveFailed"), error);
    setMessage(
      error.message || t("admin.languages.actions.saveFailed"),
      "error"
    );
  }
};

const { t } = useI18n();
const { showConfirm } = useConfirm();

const deleteLanguage = async (lang: Language) => {
  const confirmed = await showConfirm({
    title: t("admin.languages.actions.delete"),
    message: t("admin.languages.actions.deleteConfirm", { name: lang.name }),
    type: "danger",
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
  });

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/api/admin/languages/${lang.id}`);
    await loadLanguages();
    setMessage(t("admin.languages.actions.deleteSuccess"), "success");
  } catch (error: any) {
    console.error(t("admin.languages.actions.deleteFailed"), error);
    setMessage(
      error.message || t("admin.languages.actions.deleteFailed"),
      "error"
    );
  }
};

const toggleActive = async (lang: Language) => {
  if (lang.isDefault && lang.isActive) {
    return;
  }
  try {
    await api.patch(`/api/admin/languages/${lang.id}`, {
      isActive: !lang.isActive,
    });
    await loadLanguages();
    setMessage(
      lang.isActive
        ? t("admin.languages.actions.disableSuccess")
        : t("admin.languages.actions.enableSuccess"),
      "success"
    );
  } catch (error: any) {
    setMessage(
      error.message || t("admin.languages.actions.saveFailed"),
      "error"
    );
  }
};

onMounted(() => {
  loadLanguages();
});
</script>
