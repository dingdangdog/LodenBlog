<template>
  <div
    class="relative isolate min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl"></div>
    </div>

    <!-- 右上角语言 & 主题切换 -->
    <div
      class="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-lg border border-border bg-surface/80 px-2 py-1 shadow-sm backdrop-blur">
      <AppLanguageSwitcher />
      <AppThemeToggle />
    </div>

    <div
      class="relative z-10 max-w-md w-full space-y-8 rounded-2xl border border-border bg-surface/95 p-8 shadow-xl backdrop-blur-sm">
      <div>
        <h2 class="mt-2 text-center text-3xl font-extrabold text-foreground">
          {{ $t("auth.login") }}
        </h2>
      </div>

      <div v-if="successMessage"
        class="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-green-700 dark:text-green-300">
        {{ successMessage }}
      </div>

      <!-- OAuth 登录 -->
      <div v-if="hasAnyOAuth" class="space-y-3">
        <button v-if="authProviders.githubLoginEnabled" @click="signInWithProvider('github')" type="button"
          class="w-full flex items-center justify-center gap-3 px-4 py-2 border border-border rounded-md shadow-sm bg-surface-muted/40 text-foreground hover:bg-surface-muted transition-colors">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          {{ $t("auth.loginWithGithub") }}
        </button>

        <button v-if="authProviders.googleLoginEnabled" @click="signInWithProvider('google')" type="button"
          class="w-full flex items-center justify-center gap-3 px-4 py-2 border border-border rounded-md shadow-sm bg-surface-muted/40 text-foreground hover:bg-surface-muted transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {{ $t("auth.loginWithGoogle") }}
        </button>
      </div>

      <div v-if="hasAnyOAuth" class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-surface text-muted">{{
            $t("auth.orLoginWithEmail")
          }}</span>
        </div>
      </div>

      <!-- 邮箱密码登录 -->
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div v-if="errorMessage"
          class="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-700 dark:text-red-300">
          {{ errorMessage }}
        </div>

        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="email" class="sr-only">{{ $t("auth.email") }}</label>
            <input id="email" v-model="form.email" type="text" required
              class="appearance-none relative block w-full px-3 py-2 border border-border placeholder:text-muted text-foreground rounded-md focus:outline-none focus:ring-primary-500 focus:z-10 sm:text-sm bg-surface"
              :placeholder="$t('auth.email') + ' / ' + $t('auth.username')" />
          </div>
          <div>
            <label for="password" class="sr-only">{{
              $t("auth.password")
            }}</label>
            <input id="password" v-model="form.password" type="password" required
              class="appearance-none relative block w-full px-3 py-2 border border-border placeholder:text-muted text-foreground rounded-md focus:outline-none focus:ring-primary-500 focus:z-10 sm:text-sm bg-surface"
              :placeholder="$t('auth.password')" />
          </div>
        </div>

        <div>
          <button type="submit" :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <span v-if="loading">{{ $t("common.loading") }}</span>
            <span v-else>{{ $t("auth.login") }}</span>
          </button>
        </div>

        <div class="text-sm text-center">
          <NuxtLink :to="localePath('/register')"
            class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            {{ $t("auth.register") }}
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  requiresAuth: false, // 公开页面，登录页
});

const { signIn, getSession } = useAuth();
const route = useRoute();
const localePath = useLocalePath();
const { t } = useI18n();

const form = reactive({
  email: "",
  password: "",
});

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const { data: authProvidersData } = await useFetch<{
  c: number;
  d: { googleLoginEnabled: boolean; githubLoginEnabled: boolean };
}>("/api/system/auth-providers");
// console.log(authProvidersData.value);

const authProviders = computed(
  () => authProvidersData.value?.d ?? { googleLoginEnabled: true, githubLoginEnabled: true }
);
const hasAnyOAuth = computed(
  () => authProviders.value.googleLoginEnabled || authProviders.value.githubLoginEnabled
);

const hasSessionUser = (
  session: unknown
): session is { user: Record<string, unknown> } => {
  if (!session || typeof session !== "object") {
    return false;
  }
  if (!("user" in session)) {
    return false;
  }
  return Boolean((session as { user?: unknown }).user);
};

// 获取来源URL（from 或 callbackUrl 参数）
const callbackUrl = computed(() => {
  const from = route.query.from as string;
  const callback = route.query.callbackUrl as string;
  return from || callback || "/";
});

// 已登录用户访问登录页时，直接跳首页
const currentSession = await getSession();
if (hasSessionUser(currentSession)) {
  await navigateTo(localePath("/"));
}

// 检查是否刚完成初始化
if (route.query.initialized === "true") {
  successMessage.value = t("auth.initSuccess");
}

const handleLogin = async () => {
  errorMessage.value = "";
  loading.value = true;

  try {
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
      callbackUrl: callbackUrl.value,
    });

    if (result?.error) {
      errorMessage.value = t("auth.loginFailedCheck");
    } else {
      // 刷新 session，确保 Header 等组件获取最新登录状态
      await getSession();
      // 登录成功，跳转到来源URL或首页
      const targetUrl = callbackUrl.value.startsWith("/")
        ? localePath(callbackUrl.value)
        : callbackUrl.value;
      await navigateTo(targetUrl);
    }
  } catch (err: any) {
    console.error("登录错误:", err);
    errorMessage.value = err.message || t("auth.loginFailedRetry");
  } finally {
    loading.value = false;
  }
};

const signInWithProvider = async (provider: string) => {
  try {
    await signIn(provider, {
      callbackUrl: callbackUrl.value,
    });
  } catch (err) {
    console.error("OAuth login error:", err);
    errorMessage.value = t("auth.oauthLoginFailed", { provider });
  }
};
</script>
