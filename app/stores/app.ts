import { defineStore } from "pinia";

interface SiteSettings {
  title: string;
  description: string;
  keyword: string;
  domain: string;
  logo: string;
  logoLight: string | null;
  logoDark: string | null;
  icon: string;
  iconLight: string | null;
  iconDark: string | null;
  defaultLang: string;
  customHead: string | null;
  customCSS: string | null;
  customJS: string | null;
}

export const useAppStore = defineStore("app", () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const settings = ref<SiteSettings | null>(null);
  const r2Domain = ref<string | null>(null);

  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  const setError = (message: string | null) => {
    error.value = message;
  };

  const setSettings = (value: SiteSettings) => {
    settings.value = value;
  };

  const setR2Domain = (domain: string | null) => {
    r2Domain.value = domain;
  };

  // 计算属性：网站标题
  const siteTitle = computed(() => {
    return settings.value?.title || "i18n Blog";
  });

  // 计算属性：网站简介
  const siteDescription = computed(() => {
    return settings.value?.description || "";
  });

  // 计算属性：网站关键字
  const siteKeyword = computed(() => {
    return settings.value?.keyword || "";
  });

  // 计算属性：网站域名
  const siteDomain = computed(() => {
    if (settings.value?.domain) {
      return settings.value.domain;
    }
    if (process.client) {
      // 客户端：从当前 URL 获取
      return window.location.origin;
    }
    // SSR：从 runtimeConfig 获取
    const config = useRuntimeConfig();
    if (config.public.siteUrl) {
      try {
        const url = new URL(config.public.siteUrl);
        return url.origin;
      } catch {
        return config.public.siteUrl;
      }
    }
    return "";
  });

  // 计算属性：网站完整 URL（包含协议和域名）
  const siteUrl = computed(() => {
    return siteDomain.value;
  });

  return {
    loading: readonly(loading),
    error: readonly(error),
    settings: readonly(settings),
    r2Domain: readonly(r2Domain),
    siteTitle,
    siteDescription,
    siteKeyword,
    siteDomain,
    siteUrl,
    setLoading,
    setError,
    setSettings,
    setR2Domain,
  };
});
