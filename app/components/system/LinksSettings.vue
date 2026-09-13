<template>
  <div class="space-y-8">
    <div v-if="message.text" class="p-3 rounded-lg text-sm" :class="messageClass">
      {{ message.text }}
    </div>

    <section class="bg-surface text-foreground rounded-2xl border border-border p-6">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t("admin.links.title") || "友链管理" }}
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="filterActive"
            class="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500">
            <option value="">{{ $t("admin.links.filters.all") || "全部" }}</option>
            <option value="true">{{ $t("admin.links.filters.active") || "启用" }}</option>
            <option value="false">{{ $t("admin.links.filters.inactive") || "禁用" }}</option>
          </select>
          <input v-model="filterSearch" type="text" :placeholder="$t('admin.links.filters.search') || '搜索名称/链接/简介...'"
            class="w-48 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          <button type="button"
            class="p-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium flex items-center gap-2"
            :disabled="listLoading" @click="loadList">
            <ArrowPathIcon :class="['w-4 h-4', listLoading && 'animate-spin']" />
          </button>
          <button type="button"
            class="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2"
            @click="openEdit(null)">
            <PlusIcon class="w-4 h-4" />
            {{ $t("admin.links.add") || "新增友链" }}
          </button>
        </div>
      </div>

      <div v-if="listLoading" class="py-8 text-center text-sm text-muted">
        <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
        <p>{{ $t("common.loading") }}</p>
      </div>

      <div v-else-if="!list.length" class="py-8 text-center text-sm text-muted">
        {{ $t("admin.links.noData") || "暂无友链" }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted w-20">图标</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">名称</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted max-w-[180px]">目标链接</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted max-w-[200px]">简介</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted w-20">排序</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">状态</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-muted">时间</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-muted">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id" class="border-b border-border hover:bg-surface-muted">
              <td class="py-3 px-4">
                <img v-if="item.icon" :src="item.icon" :alt="item.name" class="w-8 h-8 rounded object-cover" />
                <span v-else class="text-muted text-xs">—</span>
              </td>
              <td class="py-3 px-4 text-sm font-medium text-foreground">{{ item.name }}</td>
              <td class="py-3 px-4 text-sm text-foreground max-w-[180px] truncate" :title="item.url">
                {{ item.url }}
              </td>
              <td class="py-3 px-4 text-sm text-muted max-w-[200px] line-clamp-2">
                {{ item.description || "—" }}
              </td>
              <td class="py-3 px-4 text-sm text-foreground">{{ item.sortOrder }}</td>
              <td class="py-3 px-4">
                <span :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  item.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                ]">
                  {{ item.isActive ? ($t("admin.links.status.active") || "启用") : ($t("admin.links.status.inactive") ||
                    "禁用") }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-muted">{{ formatDate(item.createdAt) }}</td>
              <td class="py-3 px-4 text-right">
                <button type="button"
                  class="px-2 py-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 rounded transition-colors mr-1"
                  @click="openEdit(item)">
                  {{ $t("admin.links.edit") || "编辑" }}
                </button>
                <button type="button"
                  class="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 rounded transition-colors"
                  @click="deleteItem(item)">
                  {{ $t("admin.comment.delete") || "删除" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 新增/编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          @click.stop>
          <div class="p-6 border-b border-border">
            <h3 class="text-lg font-semibold text-foreground">
              {{ editing ? ($t("admin.links.edit") || "编辑友链") : ($t("admin.links.add") || "新增友链") }}
            </h3>
          </div>
          <form class="p-6 space-y-4" @submit.prevent="submitForm">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">图标链接</label>
              <input v-model="form.icon" type="url" placeholder="https://..."
                class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <div class="mt-2 flex items-center gap-3">
                <div
                  class="relative w-12 h-12 rounded-lg border border-border bg-surface-muted flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    v-if="form.icon?.trim() && !iconPreviewError"
                    :key="form.icon"
                    :src="form.icon.trim()"
                    alt=""
                    class="w-full h-full object-cover"
                    @error="iconPreviewError = true"
                    @load="iconPreviewError = false"
                  />
                  <span v-else-if="form.icon?.trim() && iconPreviewError" class="text-xs text-red-500 px-1 text-center">加载失败</span>
                  <span v-else class="text-xs text-muted">暂无</span>
                </div>
                <p v-if="form.icon?.trim() && !iconPreviewError" class="text-xs text-muted">图标将随链接自动刷新</p>
                <p v-else-if="form.icon?.trim() && iconPreviewError" class="text-xs text-red-500">请检查链接是否可访问</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">目标链接 <span
                  class="text-red-500">*</span></label>
              <div class="flex gap-2">
                <input v-model="form.url" type="url" required placeholder="https://..."
                  class="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                <button type="button"
                  class="px-3 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted text-sm font-medium whitespace-nowrap disabled:opacity-50 flex items-center gap-1"
                  :disabled="!form.url.trim() || parseLoading" @click="parseMetadata">
                  <ArrowPathIcon :class="['w-4 h-4', parseLoading && 'animate-spin']" />
                  {{ $t("admin.links.parse") || "自动解析" }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">名称 <span
                  class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" required maxlength="100" placeholder="站点名称"
                class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">简介</label>
              <input v-model="form.description" type="text" maxlength="500" placeholder="简短介绍（可选）"
                class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">排序</label>
              <input v-model.number="form.sortOrder" type="number" min="0" step="1"
                class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <p class="text-xs text-muted mt-1">数字越小越靠前</p>
            </div>
            <div class="flex items-center gap-2">
              <input v-model="form.isActive" type="checkbox" id="link-active"
                class="rounded border-border text-primary-600 focus:ring-primary-500" />
              <label for="link-active" class="text-sm text-foreground">启用（前台展示）</label>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button"
                class="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-surface-muted text-sm font-medium"
                @click="showModal = false">
                {{ $t("common.cancel") || "取消" }}
              </button>
              <button type="submit"
                class="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
                :disabled="submitLoading">
                {{ submitLoading ? "..." : ($t("common.save") || "保存") }}
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
import { ArrowPathIcon, PlusIcon } from "@heroicons/vue/24/outline";

const { t } = useI18n();
const { showConfirm } = useConfirm();

interface FriendLink {
  id: string;
  icon: string | null;
  url: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const list = ref<FriendLink[]>([]);
const listLoading = ref(false);
const filterSearch = ref("");
const filterActive = ref("");
const showModal = ref(false);
const editing = ref<FriendLink | null>(null);
const submitLoading = ref(false);
const parseLoading = ref(false);

const form = reactive({
  icon: "",
  url: "",
  name: "",
  description: "",
  isActive: true,
  sortOrder: 0,
});

const iconPreviewError = ref(false);

watch(() => form.icon, () => {
  iconPreviewError.value = false;
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

function setMessage(text: string, type: "success" | "error" = "error") {
  message.text = text;
  message.type = type;
  setTimeout(() => {
    message.text = "";
  }, 4000);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function openEdit(item: FriendLink | null) {
  editing.value = item;
  if (item) {
    form.icon = item.icon ?? "";
    form.url = item.url;
    form.name = item.name;
    form.description = item.description ?? "";
    form.isActive = item.isActive;
    form.sortOrder = item.sortOrder;
  } else {
    form.icon = "";
    form.url = "";
    form.name = "";
    form.description = "";
    form.isActive = true;
    form.sortOrder = 0;
  }
  showModal.value = true;
}

async function loadList() {
  listLoading.value = true;
  try {
    const query: Record<string, string> = {};
    if (filterSearch.value.trim()) query.search = filterSearch.value.trim();
    if (filterActive.value !== "") query.isActive = filterActive.value;
    list.value = await api.get<FriendLink[]>("/api/admin/links", { query });
  } catch (err: any) {
    setMessage(err?.message || (t("admin.links.messages.loadFailed") || "加载失败"), "error");
  } finally {
    listLoading.value = false;
  }
}

async function submitForm() {
  submitLoading.value = true;
  try {
    const payload = {
      icon: form.icon.trim() || null,
      url: form.url.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    };
    if (editing.value) {
      await api.patch(`/api/admin/links/${editing.value.id}`, payload);
      setMessage(t("admin.links.messages.updateSuccess") || "更新成功", "success");
    } else {
      await api.post("/api/admin/links", payload);
      setMessage(t("admin.links.messages.createSuccess") || "创建成功", "success");
    }
    showModal.value = false;
    await loadList();
  } catch (err: any) {
    setMessage(err?.message || (t("admin.links.messages.saveFailed") || "保存失败"), "error");
  } finally {
    submitLoading.value = false;
  }
}

async function deleteItem(item: FriendLink) {
  const confirmed = await showConfirm({
    title: t("admin.comment.delete") || "删除",
    message: t("admin.links.messages.deleteConfirm") || "确定要删除该友链吗？",
    type: "danger",
    confirmText: t("common.delete") || "删除",
    cancelText: t("common.cancel") || "取消",
  });
  if (!confirmed) return;
  try {
    await api.delete(`/api/admin/links/${item.id}`);
    setMessage(t("admin.links.messages.deleteSuccess") || "删除成功", "success");
    await loadList();
  } catch (err: any) {
    setMessage(err?.message || (t("admin.links.messages.deleteFailed") || "删除失败"), "error");
  }
}

interface ParseMetaResult {
  name: string;
  description: string;
  icon: string | null;
}

async function parseMetadata() {
  const url = form.url.trim();
  if (!url) {
    setMessage(t("admin.links.messages.parseNoUrl") || "请先填写目标链接", "error");
    return;
  }
  parseLoading.value = true;
  try {
    const data = await api.get<ParseMetaResult>("/api/admin/links/parse-metadata", {
      query: { url },
    });
    if (data.name) form.name = data.name;
    if (data.description) form.description = data.description;
    if (data.icon) form.icon = data.icon;
    setMessage(t("admin.links.messages.parseSuccess") || "解析成功，已自动填入", "success");
  } catch (err: any) {
    setMessage(err?.message || (t("admin.links.messages.parseFailed") || "解析失败"), "error");
  } finally {
    parseLoading.value = false;
  }
}

watch([filterSearch, filterActive], () => {
  loadList();
});

onMounted(() => {
  loadList();
});
</script>
