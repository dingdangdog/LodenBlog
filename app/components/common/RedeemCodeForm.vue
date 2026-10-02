<template>
  <form class="space-y-2" @submit.prevent="submit">
    <!-- <label class="block text-sm font-medium text-foreground">{{ $t("column.redeemLabel") }}</label> -->
    <div class="flex flex-col sm:flex-row gap-2">
      <input v-model="code" type="text" autocomplete="off" :placeholder="$t('column.redeemPlaceholder')"
        class="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground" />
      <NuxtLink v-if="!loggedIn" :to="localePath('/login')"
        class="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">
        {{ $t("column.loginToRedeem") }}
      </NuxtLink>
      <button v-else type="submit"
        class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        :disabled="pending || !code.trim()">
        {{ pending ? $t("column.redeeming") : $t("column.redeemSubmit") }}
      </button>
    </div>
    <p v-if="message" class="text-sm text-green-600 dark:text-green-400">{{ message }}</p>
    <p v-if="errorText" class="text-sm text-red-600 dark:text-red-400">{{ errorText }}</p>
  </form>
</template>

<script setup lang="ts">
const emit = defineEmits<{ success: [] }>();
const { data: session } = useAuth();
const localePath = useLocalePath();
const loggedIn = computed(() => !!session.value?.user);
const code = ref("");
const message = ref("");
const errorText = ref("");
const pending = ref(false);

async function submit() {
  message.value = "";
  errorText.value = "";
  pending.value = true;
  try {
    const response = await $fetch<{ c: number; m?: string }>("/api/entry/redeem", {
      method: "POST",
      body: { code: code.value },
    });
    if (response?.c === 200) {
      message.value = response.m || "";
      code.value = "";
      emit("success");
    } else {
      errorText.value = response?.m || "";
    }
  } catch (err: unknown) {
    errorText.value = err instanceof Error ? err.message : "";
  } finally {
    pending.value = false;
  }
}
</script>
