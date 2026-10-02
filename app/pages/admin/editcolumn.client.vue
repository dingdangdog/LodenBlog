<template>
  <div class="space-y-4">
    <div class="overflow-hidden rounded-2xl border border-border bg-surface">
      <div
        v-if="message"
        class="mx-4 mt-4 rounded-lg p-3 text-sm sm:mx-6"
        :class="messageOk
          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
          : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'"
      >
        {{ message }}
      </div>

      <div class="overflow-x-auto border-b border-border">
        <nav class="flex h-11 min-w-0">
          <button
            v-for="item in tabs"
            :key="item.id"
            type="button"
            class="box-border flex h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-5"
            :class="activeTab === item.id
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-muted hover:border-border hover:text-foreground'"
            @click="activeTab = item.id"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            <span class="ml-1.5 hidden sm:inline">{{ item.label }}</span>
          </button>
        </nav>
      </div>

      <div class="border-b border-border px-3 py-2 sm:px-4">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div class="flex min-w-0 items-center gap-2">
            <div
              v-if="form.isPublished"
              class="inline-flex shrink-0 rounded-md border border-green-200 bg-green-50 px-2.5 py-1 dark:border-green-800 dark:bg-green-900/20"
            >
              <span class="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-300">
                <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                {{ $t("admin.columns.published") }}
              </span>
            </div>
            <label class="hidden shrink-0 text-sm font-medium text-foreground md:inline">
              {{ $t("admin.columns.fields.language") }}
            </label>
            <AppSelect
              v-model="form.languageCode"
              :options="languageOptions"
              :placeholder="$t('admin.columns.fields.language')"
              :allow-clear="false"
              :searchable="true"
              class="w-full min-w-0 max-w-56 shrink-0"
              @change="loadContent"
            />
          </div>
          <div class="grid w-full grid-cols-3 gap-2 md:flex md:w-auto md:items-center">
            <NuxtLink
              :to="localePath('/admin/columns')"
              class="truncate rounded-lg border border-border px-2 py-1.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-surface-muted sm:px-3"
            >
              {{ $t("admin.columns.back") }}
            </NuxtLink>
            <button
              type="button"
              class="truncate rounded-lg border border-border bg-surface px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60 sm:px-3"
              :disabled="saving"
              @click="save(false)"
            >
              {{ saving ? $t("admin.columns.actions.saving") : $t("admin.columns.actions.save") }}
            </button>
            <button
              type="button"
              class="truncate rounded-lg bg-primary-600 px-2 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60 sm:px-3"
              :disabled="saving"
              @click="save(true)"
            >
              {{ form.isPublished ? $t("admin.columns.actions.unpublish") : $t("admin.columns.actions.publish") }}
            </button>
          </div>
        </div>
      </div>

      <form v-show="activeTab === 'content'" class="space-y-6 p-3 md:p-4" @submit.prevent="save(false)">
        <section class="space-y-4">
          <h2 class="text-lg font-semibold text-foreground">{{ $t("admin.columns.sections.content") }}</h2>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="block text-sm font-medium text-foreground">
              {{ $t("admin.columns.fields.title") }}
              <span class="text-red-500">*</span>
              <input v-model="form.title" required class="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </label>
            <label class="block text-sm font-medium text-foreground">
              {{ $t("admin.columns.fields.slug") }}
              <span class="text-red-500">*</span>
              <input v-model="form.slug" required class="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500" @input="form.slug = form.slug.toLowerCase()" />
            </label>
          </div>
          <label class="block text-sm font-medium text-foreground">
            {{ $t("admin.columns.fields.description") }}
            <textarea v-model="form.description" rows="4" class="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"></textarea>
          </label>
          <div>
            <p class="mb-2 text-sm font-medium text-foreground">{{ $t("admin.columns.fields.cover") }}</p>
            <div class="flex flex-col gap-4 sm:flex-row">
              <div class="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-muted sm:w-48">
                <img v-if="form.featuredImage" :src="form.featuredImage" alt="" class="h-full w-full object-cover" />
                <span v-else class="text-xs text-muted">{{ $t("admin.columns.coverEmpty") }}</span>
              </div>
              <div class="flex-1 space-y-2">
                <input v-model="form.featuredImage" type="url" class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500" />
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted" @click="showMediaSelect = true">
                    <PhotoIcon class="h-4 w-4" />
                    {{ $t("admin.editpost.actions.selectMedia") }}
                  </button>
                  <button type="button" class="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50" :disabled="!form.featuredImage" @click="form.featuredImage = ''">
                    <XMarkIcon class="h-4 w-4" />
                    {{ $t("admin.editpost.actions.clearCover") }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-4 border-t border-border pt-6">
          <h2 class="text-lg font-semibold text-foreground">{{ $t("admin.columns.sections.seo") }}</h2>
          <label class="block text-sm font-medium text-foreground">
            {{ $t("admin.columns.fields.seoTitle") }}
            <input v-model="form.seoTitle" class="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </label>
          <label class="block text-sm font-medium text-foreground">
            {{ $t("admin.columns.fields.seoDescription") }}
            <textarea v-model="form.seoDescription" rows="2" class="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"></textarea>
          </label>
          <label class="block text-sm font-medium text-foreground">
            {{ $t("admin.columns.fields.seoKeyword") }}
            <input v-model="form.seoKeyword" class="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </label>
        </section>
      </form>

      <div v-if="columnId && activeTab === 'articles'" class="space-y-5 p-3 md:p-4">
        <div>
          <input
            v-model="articleQuery"
            type="search"
            :placeholder="$t('admin.columns.articles.searchPlaceholder')"
            class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <p v-if="!articleQuery.trim()" class="mt-3 text-sm font-medium text-foreground">
            {{ $t("admin.columns.articles.recent") }}
          </p>
          <p v-if="articleQuery.trim() && !articlesPending && articleCandidates.length === 0" class="py-6 text-center text-sm text-muted">
            {{ $t("admin.columns.articles.noMatch") }}
          </p>
          <ul v-if="articleCandidates.length" class="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
            <li v-for="item in articleCandidates" :key="item.id" class="flex items-center justify-between gap-3 p-3">
              <div class="min-w-0">
                <p class="truncate font-medium text-foreground">{{ item.title || item.slug }}</p>
                <p class="mt-0.5 text-xs text-muted">
                  <span v-if="item.accessType === 'PAID'">{{ $t("column.paid") }}</span>
                  <span v-else-if="item.columnTitle">{{ $t("admin.columns.articles.inOtherColumn", { title: item.columnTitle }) }}</span>
                  <span v-else>{{ $t("column.free") }}</span>
                  · {{ item.isPublished ? $t("admin.columns.published") : $t("admin.columns.draft") }}
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                :disabled="articleBusyId === item.id"
                @click="addArticle(item)"
              >
                {{ $t("admin.columns.articles.add") }}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-lg font-semibold text-foreground">{{ $t("admin.columns.articles.current") }}</h2>
          <p v-if="articlesPending && columnArticles.length === 0" class="py-8 text-center text-sm text-muted">
            {{ $t("common.loading") }}
          </p>
          <p v-else-if="columnArticles.length === 0" class="py-8 text-center text-sm text-muted">
            {{ $t("admin.columns.articles.empty") }}
          </p>
          <ul v-else class="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
            <li v-for="item in columnArticles" :key="item.id" class="flex items-center justify-between gap-3 p-3">
              <div class="min-w-0">
                <p class="truncate font-medium text-foreground">{{ item.title || item.slug }}</p>
                <p class="mt-0.5 text-xs text-muted">
                  {{ item.isPublished ? $t("admin.columns.published") : $t("admin.columns.draft") }}
                  <span v-if="item.slug"> · /post/{{ item.slug }}</span>
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
                :disabled="articleBusyId === item.id"
                @click="removeArticle(item)"
              >
                {{ $t("admin.columns.articles.remove") }}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="columnId && activeTab === 'codes'" class="p-3 md:p-4">
        <AdminRedeemCodeManager
          :title="$t('admin.columns.codes.title')"
          :list-url="`/api/creator/columns/${columnId}/redeem-codes`"
          :create-url="`/api/creator/columns/${columnId}/redeem-codes`"
          show-duration
        />
      </div>

      <div v-if="columnId && activeTab === 'subscriptions'" class="space-y-4 p-3 md:p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg font-semibold text-foreground">{{ $t("admin.columns.subscriptions.title") }}</h2>
          <div class="w-full sm:w-48">
            <AppSelect
              v-model="subscriptionStatus"
              :options="subscriptionStatusOptions"
              :allow-clear="false"
              @change="loadSubscriptions"
            />
          </div>
        </div>
        <p v-if="subscriptions.length === 0" class="py-8 text-center text-sm text-muted">{{ $t("admin.columns.subscriptions.empty") }}</p>
        <div v-else class="divide-y divide-border overflow-hidden rounded-xl border border-border">
          <article v-for="item in subscriptions" :key="item.id" class="p-3 text-sm sm:p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-medium text-foreground">{{ item.user?.name || item.user?.username }}</p>
              <span
                class="rounded px-2 py-0.5 text-xs font-medium"
                :class="item.active
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-surface-muted text-muted'"
              >
                {{ item.active ? $t("column.active") : $t("column.expired") }}
              </span>
            </div>
            <p class="mt-1 text-muted">
              {{ $t("column.remainingDays", { count: item.remainingDays }) }}
              · {{ formatDate(item.startsAt) }} – {{ formatDate(item.expiresAt) }}
            </p>
            <ul v-if="item.logs?.length" class="mt-2 space-y-1 text-xs text-muted">
              <li v-for="log in item.logs" :key="log.id">
                {{ $t("column.durationDays", { count: log.durationDays }) }}
                · {{ formatDate(log.appliedFrom) }} – {{ formatDate(log.appliedTo) }}
              </li>
            </ul>
          </article>
        </div>
      </div>

      <MediaSelect
        v-model="showMediaSelect"
        :multiple="false"
        :selected="form.featuredImage"
        @confirm="handleMediaSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { DocumentTextIcon, KeyIcon, NewspaperIcon, UsersIcon, PhotoIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import MediaSelect from "~/components/common/MediaSelect.vue";
import { useConfirm } from "~/composables/useConfirm";

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "creator"],
});

const route = useRoute();
const localePath = useLocalePath();
const { t } = useI18n();
const { showConfirm } = useConfirm();
const { list: localeList } = useEnabledLocales();
const locales = computed(() => localeList.value || []);
const languageOptions = computed(() =>
  locales.value.map((lang) => ({
    value: lang.code,
    label: lang.nativeName || lang.name,
  }))
);
const subscriptionStatusOptions = computed(() => [
  { value: "all", label: t("admin.columns.subscriptions.all") },
  { value: "active", label: t("column.active") },
  { value: "expired", label: t("column.expired") },
]);
const columnId = ref(String(route.query.id || ""));
const saving = ref(false);
const message = ref("");
const messageOk = ref(true);
const subscriptionStatus = ref("all");
const subscriptions = ref<any[]>([]);
const showMediaSelect = ref(false);
const activeTab = ref("content");
const articleQuery = ref("");
const articlesPending = ref(false);
const articleBusyId = ref("");
const columnArticles = ref<any[]>([]);
const articleCandidates = ref<any[]>([]);
let articleQueryTimer: ReturnType<typeof setTimeout> | null = null;
const form = reactive({
  languageCode: "zh",
  title: "",
  slug: "",
  description: "",
  featuredImage: "",
  seoTitle: "",
  seoDescription: "",
  seoKeyword: "",
  isPublished: false,
});

const tabs = computed(() => {
  const items = [{ id: "content", label: t("admin.columns.sections.content"), icon: DocumentTextIcon }];
  if (columnId.value) {
    items.push(
      { id: "articles", label: t("admin.columns.articles.title"), icon: NewspaperIcon },
      { id: "codes", label: t("admin.columns.codes.title"), icon: KeyIcon },
      { id: "subscriptions", label: t("admin.columns.subscriptions.title"), icon: UsersIcon },
    );
  }
  return items;
});

function formatDate(value: string) {
  return value ? new Date(value).toLocaleString() : "";
}

function handleMediaSelect(url: string | string[]) {
  form.featuredImage = typeof url === "string" ? url : url[0] || "";
  showMediaSelect.value = false;
}

async function loadContent() {
  if (!columnId.value || !form.languageCode) return;
  const response = await $fetch<{ c: number; d?: any }>(`/api/creator/columns/${columnId.value}`, {
    query: { languageCode: form.languageCode },
  });
  if (response?.c !== 200) return;
  form.featuredImage = response.d.column.featuredImage || "";
  form.isPublished = !!response.d.column.isPublished;
  const content = response.d.content;
  form.title = content?.title || "";
  form.slug = content?.slug || "";
  form.description = content?.description || "";
  form.seoTitle = content?.seoTitle || "";
  form.seoDescription = content?.seoDescription || "";
  form.seoKeyword = content?.seoKeyword || "";
}

let articleLoadSeq = 0;

async function loadArticles() {
  if (!columnId.value) return;
  const seq = ++articleLoadSeq;
  articlesPending.value = true;
  try {
    const response = await $fetch<{ c: number; d?: { articles: any[]; candidates: any[] } }>(
      `/api/creator/columns/${columnId.value}/articles`,
      { query: { languageCode: form.languageCode, q: articleQuery.value.trim() } }
    );
    if (seq !== articleLoadSeq) return;
    if (response?.c === 200) {
      columnArticles.value = response.d?.articles || [];
      articleCandidates.value = response.d?.candidates || [];
    }
  } finally {
    if (seq === articleLoadSeq) articlesPending.value = false;
  }
}

async function addArticle(item: { id: string; accessType?: string; columnId?: string | null; columnTitle?: string }) {
  if (item.accessType === "PAID") {
    const ok = await showConfirm({
      title: t("admin.columns.articles.add"),
      message: t("admin.columns.articles.confirmPaid"),
      confirmText: t("common.confirm"),
      cancelText: t("common.cancel"),
      type: "warning",
    });
    if (!ok) return;
  } else if (item.columnId) {
    const ok = await showConfirm({
      title: t("admin.columns.articles.add"),
      message: t("admin.columns.articles.confirmMove", { title: item.columnTitle || "" }),
      confirmText: t("common.confirm"),
      cancelText: t("common.cancel"),
      type: "warning",
    });
    if (!ok) return;
  }
  articleBusyId.value = item.id;
  message.value = "";
  try {
    const response = await $fetch<{ c: number; m?: string }>(`/api/creator/columns/${columnId.value}/articles`, {
      method: "POST",
      body: { articleId: item.id },
    });
    if (response?.c === 200) {
      messageOk.value = true;
      message.value = t("admin.columns.articles.added");
      await loadArticles();
    } else {
      messageOk.value = false;
      message.value = response?.m || t("admin.columns.messages.failed");
    }
  } finally {
    articleBusyId.value = "";
  }
}

async function removeArticle(item: { id: string; title?: string }) {
  const ok = await showConfirm({
    title: t("admin.columns.articles.remove"),
    message: t("admin.columns.articles.confirmRemove", { title: item.title || "" }),
    confirmText: t("admin.columns.articles.remove"),
    cancelText: t("common.cancel"),
    type: "danger",
  });
  if (!ok) return;
  articleBusyId.value = item.id;
  message.value = "";
  try {
    const response = await $fetch<{ c: number; m?: string }>(
      `/api/creator/columns/${columnId.value}/articles/${item.id}`,
      { method: "DELETE" }
    );
    if (response?.c === 200) {
      messageOk.value = true;
      message.value = t("admin.columns.articles.removed");
      await loadArticles();
    } else {
      messageOk.value = false;
      message.value = response?.m || t("admin.columns.messages.failed");
    }
  } finally {
    articleBusyId.value = "";
  }
}

async function loadSubscriptions() {
  if (!columnId.value) return;
  const response = await $fetch<{ c: number; d?: { subscriptions: any[] } }>(
    `/api/creator/columns/${columnId.value}/subscriptions`,
    { query: { status: subscriptionStatus.value } }
  );
  subscriptions.value = response?.c === 200 ? response.d?.subscriptions || [] : [];
}

async function save(togglePublish: boolean) {
  saving.value = true;
  message.value = "";
  const isPublished = togglePublish ? !form.isPublished : form.isPublished;
  const body = { ...form, isPublished };
  try {
    const response = columnId.value
      ? await $fetch<{ c: number; m?: string }>(`/api/creator/columns/${columnId.value}`, { method: "PATCH", body })
      : await $fetch<{ c: number; m?: string; d?: { column: { id: string } } }>("/api/creator/columns", { method: "POST", body });
    if (response?.c === 200) {
      form.isPublished = isPublished;
      messageOk.value = true;
      if (!columnId.value && "d" in response && response.d?.column?.id) {
        columnId.value = response.d.column.id;
        await navigateTo(localePath(`/admin/editcolumn?id=${columnId.value}`));
      }
      message.value = t("admin.columns.messages.saved");
      await loadSubscriptions();
    } else {
      messageOk.value = false;
      message.value = response?.m || t("admin.columns.messages.failed");
    }
  } finally {
    saving.value = false;
  }
}

watch(locales, (items) => {
  if (!form.languageCode && items[0]) form.languageCode = items[0].code;
}, { immediate: true });

watch(activeTab, (value) => {
  if (value === "articles") loadArticles();
});

watch(articleQuery, () => {
  if (activeTab.value !== "articles") return;
  if (articleQueryTimer) clearTimeout(articleQueryTimer);
  articleQueryTimer = setTimeout(() => loadArticles(), 300);
});

watch(() => form.languageCode, () => {
  if (activeTab.value === "articles") loadArticles();
});

onMounted(async () => {
  if (locales.value[0] && form.languageCode === "zh" && !locales.value.some((item) => item.code === "zh")) {
    form.languageCode = locales.value[0].code;
  }
  await loadContent();
  await loadSubscriptions();
});
</script>
