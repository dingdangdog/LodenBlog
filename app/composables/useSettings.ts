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

export const useSettings = async (language?: string) => {
  const { locale } = useI18n();
  const lang = language || locale.value || "zh";

  const { data, error } = await useFetch<{ c: number; m: string; d: SiteSettings }>(
    "/api/settings",
    {
      query: { language: lang },
      default: () => ({
        c: 200,
        m: "success",
        d: {
          title: "Loden",
          description: "",
          keyword: "",
          domain: "",
          logo: "",
          logoLight: null,
          logoDark: null,
          icon: "",
          iconLight: null,
          iconDark: null,
          defaultLang: "zh",
          customHead: null,
          customCSS: null,
          customJS: null,
        },
      }),
    }
  );

  const settings = computed(() => {
    if (error.value || !data.value?.d) {
      return {
        title: "Loden",
        description: "",
        keyword: "",
        domain: "",
        logo: "",
        logoLight: null,
        logoDark: null,
        icon: "",
        iconLight: null,
        iconDark: null,
        defaultLang: "zh",
        customHead: null,
        customCSS: null,
        customJS: null,
      };
    }
    return data.value.d;
  });

  return settings;
};
