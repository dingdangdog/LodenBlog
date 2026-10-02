<template>
  <span v-if="badge" :title="badge.title"
    class="inline-flex shrink-0 select-none items-center gap-1 whitespace-nowrap rounded-md border font-medium leading-none"
    :class="[badge.tone, size === 'lg' ? 'px-2 py-1 text-sm' : 'px-1.5 py-[3px] text-xs']">
    <component :is="badge.icon" :class="size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'" aria-hidden="true" />
    <span>{{ badge.label }}</span>
  </span>
</template>

<script setup lang="ts">
import { LockClosedIcon, RectangleStackIcon } from "@heroicons/vue/20/solid";

const props = withDefaults(
  defineProps<{
    accessType?: string | null;
    size?: "sm" | "lg";
  }>(),
  { size: "sm" },
);

const { t } = useI18n();

const badge = computed(() => {
  if (props.accessType === "PAID") {
    return {
      icon: LockClosedIcon,
      label: t("column.paid"),
      title: t("column.paidArticle"),
      tone: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    };
  }
  if (props.accessType === "COLUMN") {
    return {
      icon: RectangleStackIcon,
      label: t("column.column"),
      title: t("column.columnArticle"),
      tone: "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300",
    };
  }
  return null;
});
</script>
