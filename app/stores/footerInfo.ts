import { defineStore } from "pinia";

export type FooterInfoItem = {
  slug: string;
  sortOrder: number;
  titles: Record<string, string>;
};

export type FooterInfoLink = {
  slug: string;
  title: string;
};

export const useFooterInfoStore = defineStore("footerInfo", () => {
  const cache = ref<FooterInfoItem[] | null>(null);

  async function fetch() {
    if (cache.value) return cache.value;
    try {
      const res = await $fetch<{ c: number; d: FooterInfoItem[] }>("/api/info");
      if (res?.c === 200 && Array.isArray(res.d)) {
        cache.value = res.d;
        return cache.value;
      }
    } catch (e) {
      console.warn("[FooterInfo] fetch failed", e);
    }
    return [];
  }

  /** 根据当前语言从缓存解析出链接列表，切换语言时无需再请求后端 */
  function getLinks(locale: string): FooterInfoLink[] {
    const list = cache.value;
    if (!list?.length) return [];
    return list.map((item) => {
      const title =
        item.titles[locale] ||
        item.titles.en ||
        item.titles["zh"] ||
        Object.values(item.titles)[0] ||
        item.slug;
      return { slug: item.slug, title };
    });
  }

  function clearCache() {
    cache.value = null;
  }

  function setCache(data: FooterInfoItem[]) {
    cache.value = data;
  }

  return {
    cache: readonly(cache),
    fetch,
    getLinks,
    clearCache,
    setCache,
  };
});
