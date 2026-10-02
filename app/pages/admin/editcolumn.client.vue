<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-semibold text-foreground">
        {{ columnId ? $t("admin.columns.edit") : $t("admin.columns.create") }}
      </h1>
      <NuxtLink :to="localePath('/admin/columns')" class="text-sm text-muted">{{ $t("admin.columns.back") }}</NuxtLink>
    </div>

    <form class="space-y-4 rounded-xl border border-border bg-surface p-4" @submit.prevent="save(false)">
      <div class="block text-sm text-muted">
        <p class="mb-1">{{ $t("admin.columns.fields.language") }}</p>
        <AppSelect
          v-model="form.languageCode"
          :options="languageOptions"
          :placeholder="$t('admin.columns.fields.language')"
          :allow-clear="false"
          :searchable="true"
          @change="loadContent"
        />
      </div>
      <label class="block text-sm text-muted">
        {{ $t("admin.columns.fields.title") }}
        <input v-model="form.title" required class="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground" />
      </label>
      <label class="block text-sm text-muted">
        {{ $t("admin.columns.fields.slug") }}
        <input v-model="form.slug" required class="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground" />
      </label>
      <label class="block text-sm text-muted">
        {{ $t("admin.columns.fields.description") }}
        <textarea v-model="form.description" rows="4" class="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground"></textarea>
      </label>
      <label class="block text-sm text-muted">
        {{ $t("admin.columns.fields.cover") }}
        <input v-model="form.featuredImage" class="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground" />
      </label>
      <label class="block text-sm text-muted">
        {{ $t("admin.columns.fields.seoTitle") }}
        <input v-model="form.seoTitle" class="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground" />
      </label>
      <label class="block text-sm text-muted">
        {{ $t("admin.columns.fields.seoDescription") }}
        <textarea v-model="form.seoDescription" rows="2" class="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground"></textarea>
      </label>
      <label class="block text-sm text-muted">
        {{ $t("admin.columns.fields.seoKeyword") }}
        <input v-model="form.seoKeyword" class="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground" />
      </label>
      <p v-if="message" class="text-sm text-muted">{{ message }}</p>
      <div class="flex flex-wrap gap-2">
        <button type="submit" class="rounded-lg border border-border px-4 py-2 text-sm" :disabled="saving">
          {{ saving ? $t("admin.columns.actions.saving") : $t("admin.columns.actions.save") }}
        </button>
        <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white" :disabled="saving" @click="save(true)">
          {{ form.isPublished ? $t("admin.columns.actions.unpublish") : $t("admin.columns.actions.publish") }}
        </button>
      </div>
    </form>

    <AdminRedeemCodeManager
      v-if="columnId"
      :title="$t('admin.columns.codes.title')"
      :list-url="`/api/creator/columns/${columnId}/redeem-codes`"
      :create-url="`/api/creator/columns/${columnId}/redeem-codes`"
      show-duration
    />

    <section v-if="columnId" class="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-base font-semibold">{{ $t("admin.columns.subscriptions.title") }}</h2>
        <div class="w-full sm:w-48">
          <AppSelect
            v-model="subscriptionStatus"
            :options="subscriptionStatusOptions"
            :allow-clear="false"
            @change="loadSubscriptions"
          />
        </div>
      </div>
      <p v-if="subscriptions.length === 0" class="text-sm text-muted">{{ $t("admin.columns.subscriptions.empty") }}</p>
      <article v-for="item in subscriptions" :key="item.id" class="rounded-lg border border-border p-3 text-sm">
        <p class="font-medium">{{ item.user?.name || item.user?.username }}</p>
        <p class="text-muted">
          {{ item.active ? $t("column.active") : $t("column.expired") }}
          · {{ $t("column.remainingDays", { count: item.remainingDays }) }}
        </p>
        <p class="text-muted">{{ formatDate(item.startsAt) }} - {{ formatDate(item.expiresAt) }}</p>
        <ul v-if="item.logs?.length" class="mt-2 space-y-1 text-xs text-muted">
          <li v-for="log in item.logs" :key="log.id">
            {{ $t("column.durationDays", { count: log.durationDays }) }}
            · {{ formatDate(log.appliedFrom) }} - {{ formatDate(log.appliedTo) }}
          </li>
        </ul>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "creator"],
});

const route = useRoute();
const localePath = useLocalePath();
const { t } = useI18n();
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
const subscriptionStatus = ref("all");
const subscriptions = ref<any[]>([]);
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

function formatDate(value: string) {
  return value ? new Date(value).toLocaleString() : "";
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
      if (!columnId.value && "d" in response && response.d?.column?.id) {
        columnId.value = response.d.column.id;
        await navigateTo(localePath(`/admin/editcolumn?id=${columnId.value}`));
      }
      message.value = t("admin.columns.messages.saved");
      await loadSubscriptions();
    } else {
      message.value = response?.m || t("admin.columns.messages.failed");
    }
  } finally {
    saving.value = false;
  }
}

watch(locales, (items) => {
  if (!form.languageCode && items[0]) form.languageCode = items[0].code;
}, { immediate: true });

onMounted(async () => {
  if (locales.value[0] && form.languageCode === "zh" && !locales.value.some((item) => item.code === "zh")) {
    form.languageCode = locales.value[0].code;
  }
  await loadContent();
  await loadSubscriptions();
});
</script>
