// https://nuxt.com/docs/api/configuration/nuxt-config
import pkg from "./package.json";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: true,
  devtools: { enabled: true },
  devServer: {
    port: 7061,
  },
  app: {
    head: {
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },
  css: ["~/assets/css/themes.css", "~/assets/css/base.css"],
  runtimeConfig: {
    // Keys within public are also exposed client-side
    public: {
      siteUrl: "",
      cfr2Domain: "",
      /** 运行时可通过 NUXT_PUBLIC_VERSION 覆盖（Docker 部署） */
      version: pkg.version,
    },
    auth: {
      baseUrl: "",
      secret: process.env.NUXT_TOKEN_SECRET || "",
    },
    salt: "",
  },
  modules: [
    "@sidebase/nuxt-auth",
    "@pinia/nuxt",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/i18n",
    "@nuxtjs/sitemap",
    "nuxt-echarts",
  ],
  sitemap: {
    autoI18n: false, // 禁用自动 i18n 多 sitemap 生成，使用自定义的 sitemap.xml.ts
    exclude: [
      "/admin/**",
      "/api/**",
      "/my/**",
      "/setup",
      "/zh/admin/**",
      "/zh/api/**",
      "/zh/my/**",
      "/zh/setup",
      "/en/admin/**",
      "/en/api/**",
      "/en/my/**",
      "/en/setup",
      "/ja/admin/**",
      "/ja/api/**",
      "/ja/my/**",
      "/ja/setup",
      "/es/admin/**",
      "/es/api/**",
      "/es/my/**",
      "/es/setup",
      "/de/admin/**",
      "/de/api/**",
      "/de/my/**",
      "/de/setup",
    ],
    sources: ["/api/sitemap"],
  },
  i18n: {
    locales: [
      {
        code: "en",
        name: "English",
        iso: "en-US",
      },
      {
        code: "zh",
        name: "中文",
        iso: "zh-CN",
      },
      {
        code: "es",
        name: "Español",
        iso: "es-ES",
      },
      {
        code: "de",
        name: "Deutsch",
        iso: "de-DE",
      },
      {
        code: "ja",
        name: "日本語",
        iso: "ja-JP",
      },
    ],
    defaultLocale: "zh",
    strategy: "prefix_except_default",
    compilation: {
      // 开发环境启用严格检查，及早发现问题
      strictMessage: process.env.NODE_ENV === "development",
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
    vueI18n: "~~/i18n.config.ts",
  },
  auth: {
    baseURL: process.env.NUXT_AUTH_BASE_URL || "",
    originEnvKey: "NUXT_AUTH_BASE_URL",
    // Disable global authentication middleware
    globalAppMiddleware: false,
    provider: {
      type: "authjs",
      trustHost: false,
      addDefaultCallbackUrl: true,
    },
    sessionRefresh: {
      enablePeriodically: false,
      enableOnWindowFocus: false,
    },
  },
  // 动态引入echars图表
  echarts: {
    features: ["LabelLayout", "UniversalTransition"],
    charts: ["BarChart", "LineChart", "PieChart"],
    components: [
      "DatasetComponent",
      "GridComponent",
      "TooltipComponent",
      "LegendComponent",
      "ToolboxComponent",
      "DataZoomComponent",
    ],
  },
  // vite: {
  //   vue: {
  //     template: {},
  //   },
  //   resolve: {
  //     alias: {
  //       ".prisma/client/index-browser":
  //         "./node_modules/.prisma/client/index-browser.js",
  //     },
  //   },
  // },
});