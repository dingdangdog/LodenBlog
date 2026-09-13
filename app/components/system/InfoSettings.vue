<template>
  <div class="space-y-6">
    <div v-if="message.text" class="p-3 rounded-lg text-sm" :class="message.type === 'success'
      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
      ">
      {{ message.text }}
    </div>

    <!-- <div>
      <h3 class="text-base font-semibold text-foreground mb-1">
        {{ $t("admin.settings.info.title") }}
      </h3>
      <p class="text-sm text-muted mb-4">
        {{ $t("admin.settings.info.hint") }}
      </p>
    </div> -->

    <div v-if="loading" class="flex items-center gap-2 text-muted">
      <ArrowPathIcon class="w-5 h-5 animate-spin" />
      <span>{{ $t("common.loading") || "加载中..." }}</span>
    </div>

    <div v-else-if="!list.length" class="text-sm text-muted">
      {{ $t("admin.settings.info.loadFailed") }}
    </div>

    <div v-else class="space-y-6">

      <div v-for="item in list" :key="item.id" class="border border-border rounded-xl overflow-hidden">
        <button type="button"
          class="w-full flex items-center justify-between gap-3 px-4 py-3 bg-surface-muted/50 text-left font-medium text-foreground hover:bg-surface-muted transition-colors"
          @click="toggleExpand(item.id)">
          <span class="flex items-center gap-2 min-w-0">
            <span class="truncate">{{ itemDisplayTitle(item) }}</span>
            <span v-if="item.hidden"
              class="shrink-0 text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">隐藏</span>
          </span>
          <span class="flex items-center gap-1 shrink-0">
            <button type="button" class="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-muted"
              :title="item.hidden ? '显示' : '隐藏'" :disabled="savingBaseId === item.id" @click.stop="toggleHidden(item)">
              <EyeIcon v-if="item.hidden" class="w-5 h-5" />
              <EyeSlashIcon v-else class="w-5 h-5" />
            </button>
            <button type="button" class="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-500/10" title="删除"
              :disabled="savingBaseId === item.id" @click.stop="confirmDelete(item)">
              <TrashIcon class="w-5 h-5" />
            </button>
            <ChevronDownIcon class="w-5 h-5 transition-transform text-muted"
              :class="expanded[item.id] ? 'rotate-180' : ''" />
          </span>
        </button>
        <div v-show="expanded[item.id]" class="p-2 md:p-4 space-y-4 border-t border-border">
          <div class="flex items-center gap-4 flex-wrap">
            <label class="text-sm font-medium text-muted shrink-0">
              {{ $t("admin.settings.info.languageLabel") }}
            </label>
            <AppSelect
              :model-value="selectedContentIdByItemId[item.id]"
              @update:model-value="(val) => setSelectedContentId(item.id, val)"
              :options="contentOptions(item)"
              :placeholder="$t('admin.settings.language.selectPlaceholder')"
              :allow-clear="false"
              class="w-48"
            />
          </div>
          <template v-if="selectedContent(item)">
            <div class="space-y-3" :key="selectedContent(item)!.id">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-muted">
                  {{ getLanguageDisplayName(selectedContent(item)!.languageCode) }}
                </span>
                <span class="text-xs text-muted">
                  {{ $t("admin.settings.info.updatedAt") || "更新" }}: {{ formatDate(selectedContent(item)!.updatedAt) }}
                </span>
              </div>
              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  {{ $t("admin.settings.info.titleLabel") }}
                </label>
                <input v-model="editFor(selectedContent(item)!.id).title" type="text"
                  class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-muted mb-1">
                  {{ $t("admin.settings.info.contentLabel") }}
                </label>
                <div class="flex items-center gap-2 rounded-lg border border-border bg-surface-muted/30 overflow-hidden">
                  <div
                    class="flex-1 max-h-[120px] overflow-y-auto text-left p-2 text-sm text-foreground font-mono whitespace-pre-wrap break-words hover:bg-surface-muted/50 transition-colors cursor-pointer"
                    @click="openContentEditor(selectedContent(item)!.id)">
                    {{ editFor(selectedContent(item)!.id).content || $t("admin.settings.info.contentPlaceholder") }}
                  </div>
                  <div class="flex flex-col gap-1 p-2 border-l border-border shrink-0">
                    <button type="button" class="p-2 rounded text-muted hover:text-foreground hover:bg-surface-muted"
                      :title="$t('admin.settings.info.edit')" @click="openContentEditor(selectedContent(item)!.id)">
                      <PencilSquareIcon class="w-5 h-5" />
                    </button>
                    <a :href="previewUrl(item, selectedContent(item)!)" target="_blank" rel="noopener noreferrer"
                      class="p-2 rounded text-muted hover:text-foreground hover:bg-surface-muted inline-flex"
                      :title="$t('admin.settings.info.preview')">
                      <ArrowTopRightOnSquareIcon class="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
              <div class="flex justify-end">
                <button type="button" :disabled="savingId === selectedContent(item)!.id"
                  class="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                  @click="saveContent(selectedContent(item)!.id)">
                  <ArrowPathIcon v-if="savingId === selectedContent(item)!.id" class="w-4 h-4 animate-spin" />
                  {{ savingId === selectedContent(item)!.id ? ($t("admin.settings.actions.saving") || "保存中...") :
                    $t("admin.settings.info.save") }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Markdown 正文编辑弹窗 -->
    <Teleport to="body">
      <div v-if="editingContentId" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          @click.stop>
          <div class="flex items-center justify-between px-4 py-3 border-b border-border">
            <span class="font-medium text-foreground">{{ $t("admin.settings.info.editContent") }}</span>
            <button type="button" class="p-2 rounded text-muted hover:text-foreground hover:bg-surface-muted"
              @click="closeContentEditor">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <div class="flex-1 min-h-0 overflow-hidden p-2 md:p-4">
            <ClientOnly>
              <MarkdownEditor v-if="editingContentId" v-model="editFor(editingContentId).content" placeholder=""
                height="400px" />
            </ClientOnly>
          </div>
          <div class="flex justify-end gap-2 px-4 py-3 border-t border-border">
            <button type="button"
              class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted text-sm font-medium"
              @click="closeContentEditor">
              {{ $t("common.cancel") || "取消" }}
            </button>
            <button type="button" :disabled="savingId === editingContentId"
              class="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
              @click="saveContentAndCloseEditor">
              <ArrowPathIcon v-if="savingId === editingContentId" class="w-4 h-4 animate-spin" />
              {{ savingId === editingContentId ? ($t("admin.settings.actions.saving") || "保存中...") :
                $t("admin.settings.info.save") }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon, TrashIcon, PencilSquareIcon, ArrowTopRightOnSquareIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import MarkdownEditor from "~/components/editor/MarkdownEditor.client.vue";
import AppSelect from "~/components/app/Select.vue";

const { t, locale } = useI18n();

type InfoContent = {
  id: string;
  languageCode: string;
  title: string;
  content: string;
  updatedAt: string;
};

type InfoItem = {
  id: string;
  slug: string;
  sortOrder: number;
  hidden?: boolean;
  contents: InfoContent[];
};

const list = ref<InfoItem[]>([]);
const loading = ref(true);
const savingId = ref<string | null>(null);
const savingBaseId = ref<string | null>(null);
const savingDomain = ref(false);
const siteDomain = ref("");
const expanded = ref<Record<string, boolean>>({});
const selectedContentIdByItemId = ref<Record<string, string>>({});
const edits = ref<Record<string, { title: string; content: string }>>({});
const message = ref<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });
const editingContentId = ref<string | null>(null);
const localePath = useLocalePath();
const { list: enabledLocales } = useEnabledLocales();

function getLanguageDisplayName(code: string) {
  if (!code) return code;
  const lang = enabledLocales.value.find((l) => l.code === code);
  return lang ? (lang.nativeName || lang.name || code) : code;
}

const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: "", type: "" };
  }, 3000);
};

function itemDisplayTitle(item: InfoItem) {
  const currentCode = locale.value || "";
  const byLocale = item.contents?.find((c) => c.languageCode === currentCode);
  const first = (byLocale ?? item.contents?.[0])?.title?.trim();
  return first || item.slug;
}

function formatDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
}

function editFor(id: string) {
  return edits.value[id] ?? { title: "", content: "" };
}

function toggleExpand(id: string) {
  expanded.value[id] = !expanded.value[id];
  if (expanded.value[id]) {
    const item = list.value.find((i) => i.id === id);
    if (item?.contents?.length) {
      const currentId = selectedContentIdByItemId.value[id];
      const exists = currentId && item.contents.some((c) => c.id === currentId);
      if (!exists) {
        const preferred = item.contents.find((c) => c.languageCode === (locale.value || ""));
        selectedContentIdByItemId.value[id] = (preferred ?? item.contents[0]).id;
      }
    }
  }
}

function openContentEditor(contentId: string) {
  editingContentId.value = contentId;
}

function closeContentEditor() {
  editingContentId.value = null;
}

function previewUrl(item: InfoItem, content: InfoContent) {
  const path = localePath(`/info/${item.slug}`);
  return `${path}?languageCode=${encodeURIComponent(content.languageCode)}`;
}

function contentOptions(item: InfoItem) {
  return (item.contents || []).map((c) => ({
    value: c.id,
    label: getLanguageDisplayName(c.languageCode),
  }));
}

function selectedContent(item: InfoItem): InfoContent | null {
  const id = selectedContentIdByItemId.value[item.id];
  return (item.contents || []).find((c) => c.id === id) ?? null;
}

function setSelectedContentId(itemId: string, val: string | number | null) {
  if (val != null) {
    selectedContentIdByItemId.value[itemId] = String(val);
  }
}

async function saveContentAndCloseEditor() {
  if (!editingContentId.value) return;
  await saveContent(editingContentId.value);
  closeContentEditor();
}

async function toggleHidden(item: InfoItem) {
  savingBaseId.value = item.id;
  try {
    const res: any = await $fetch(`/api/admin/info/${item.id}`, {
      method: "PATCH",
      body: { hidden: !item.hidden },
    });
    if (res?.c === 200) {
      setMessage(t("admin.settings.info.saveSuccess"), "success");
      item.hidden = !item.hidden;
    } else {
      setMessage(res?.m || "操作失败");
    }
  } catch (e: any) {
    setMessage(e?.message || "操作失败");
  } finally {
    savingBaseId.value = null;
  }
}

function confirmDelete(item: InfoItem) {
  if (!confirm(`确定删除「${itemDisplayTitle(item)}」？该页所有语言内容将一并删除。`)) return;
  doDelete(item.id);
}

async function doDelete(id: string) {
  savingBaseId.value = id;
  try {
    const res: any = await $fetch(`/api/admin/info/${id}`, { method: "DELETE" });
    if (res?.c === 200) {
      setMessage(t("admin.settings.info.saveSuccess"), "success");
      await load();
    } else {
      setMessage(res?.m || "删除失败");
    }
  } catch (e: any) {
    setMessage(e?.message || "删除失败");
  } finally {
    savingBaseId.value = null;
  }
}

async function load() {
  loading.value = true;
  try {
    const [res, settingsRes]: [any, any] = await Promise.all([
      $fetch("/api/admin/info"),
      $fetch("/api/admin/settings"),
    ]);
    if (res?.c === 200 && Array.isArray(res.d)) {
      list.value = res.d;
      const nextEdits: Record<string, { title: string; content: string }> = {};
      for (const item of res.d) {
        for (const c of item.contents || []) {
          nextEdits[c.id] = { title: c.title || "", content: c.content || "" };
        }
      }
      edits.value = nextEdits;
    } else {
      setMessage(t("admin.settings.info.loadFailed"));
    }
    if (settingsRes?.c === 200 && settingsRes.d) {
      siteDomain.value = settingsRes.d.domain || "";
    }
  } catch (e: any) {
    setMessage(e?.message || t("admin.settings.info.loadFailed"));
  } finally {
    loading.value = false;
  }
}

async function saveDomain() {
  savingDomain.value = true;
  try {
    const res: any = await $fetch("/api/admin/settings", {
      method: "PUT",
      body: { domain: siteDomain.value || null },
    });
    if (res?.c === 200) {
      setMessage(t("admin.settings.info.saveSuccess"), "success");
    } else {
      setMessage(res?.m || t("admin.settings.info.saveFailed"));
    }
  } catch (e: any) {
    setMessage(e?.message || t("admin.settings.info.saveFailed"));
  } finally {
    savingDomain.value = false;
  }
}

async function saveContent(id: string) {
  const data = editFor(id);
  if (!data) return;
  savingId.value = id;
  try {
    const res: any = await $fetch(`/api/admin/info/content/${id}`, {
      method: "PATCH",
      body: { title: data.title, content: data.content },
    });
    if (res?.c === 200) {
      setMessage(t("admin.settings.info.saveSuccess"), "success");
      await load();
    } else {
      setMessage(res?.m || t("admin.settings.info.saveFailed"));
    }
  } catch (e: any) {
    setMessage(e?.message || t("admin.settings.info.saveFailed"));
  } finally {
    savingId.value = null;
  }
}

onMounted(() => {
  load();
});
</script>
