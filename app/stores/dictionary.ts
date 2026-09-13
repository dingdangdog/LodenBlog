import { defineStore } from "pinia";

interface DictionaryData {
  categories: Record<string, Record<string, any>>;
  tags: Record<string, Record<string, any>>;
}

export const useDictionaryStore = defineStore("dictionary", () => {
  const dictionaries = ref<DictionaryData>({
    categories: {},
    tags: {},
  });

  const loading = ref(false);
  const lastFetchTime = ref<number | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  // 默认语言代码
  const DEFAULT_LANGUAGE = "zh";

  // 获取分类名称（如果当前语言不存在，回退到默认语言）
  const getCategoryName = (slug: string, languageCode: string): string => {
    if (!slug || !languageCode) return "";
    
    // 先尝试获取当前语言的名称
    const currentLangName = dictionaries.value.categories[languageCode]?.[slug]?.name;
    if (currentLangName) return currentLangName;
    
    // 如果当前语言不存在，回退到默认语言
    if (languageCode !== DEFAULT_LANGUAGE) {
      const defaultLangName = dictionaries.value.categories[DEFAULT_LANGUAGE]?.[slug]?.name;
      if (defaultLangName) return defaultLangName;
    }
    
    // 如果默认语言也不存在，返回slug
    return slug;
  };

  // 获取标签名称（如果当前语言不存在，回退到默认语言）
  const getTagName = (slug: string, languageCode: string): string => {
    if (!slug || !languageCode) return "";
    
    // 先尝试获取当前语言的名称
    const currentLangName = dictionaries.value.tags[languageCode]?.[slug]?.name;
    if (currentLangName) return currentLangName;
    
    // 如果当前语言不存在，回退到默认语言
    if (languageCode !== DEFAULT_LANGUAGE) {
      const defaultLangName = dictionaries.value.tags[DEFAULT_LANGUAGE]?.[slug]?.name;
      if (defaultLangName) return defaultLangName;
    }
    
    // 如果默认语言也不存在，返回slug
    return slug;
  };

  // 获取分类数据
  const getCategory = (slug: string, languageCode: string) => {
    if (!slug || !languageCode) return null;
    return dictionaries.value.categories[languageCode]?.[slug] || null;
  };

  // 获取标签数据
  const getTag = (slug: string, languageCode: string) => {
    if (!slug || !languageCode) return null;
    return dictionaries.value.tags[languageCode]?.[slug] || null;
  };

  // 获取指定语言的所有分类（如果当前语言不存在，使用默认语言的名称）
  const getCategoriesByLanguage = (languageCode: string) => {
    if (!languageCode) return [];
    
    // 获取所有唯一的分类slug（从所有语言中收集）
    const allSlugs = new Set<string>();
    Object.values(dictionaries.value.categories).forEach((langCategories) => {
      if (langCategories) {
        Object.keys(langCategories).forEach((slug) => allSlugs.add(slug));
      }
    });
    
    // 为每个slug构建分类数据
    return Array.from(allSlugs).map((slug) => {
      const currentLangData = dictionaries.value.categories[languageCode]?.[slug];
      
      // 如果当前语言存在，直接使用
      if (currentLangData) {
        return {
          slug,
          ...currentLangData,
          languageCode,
        };
      }
      
      // 如果当前语言不存在，回退到默认语言
      if (languageCode !== DEFAULT_LANGUAGE) {
        const defaultLangData = dictionaries.value.categories[DEFAULT_LANGUAGE]?.[slug];
        if (defaultLangData) {
          return {
            slug,
            ...defaultLangData,
            languageCode, // 保持当前语言代码，但使用默认语言的数据
          };
        }
      }
      
      // 如果都不存在，返回基本数据
      return {
      slug,
        name: slug,
      languageCode,
      };
    });
  };

  // 获取指定语言的所有标签（如果当前语言不存在，使用默认语言的名称）
  const getTagsByLanguage = (languageCode: string) => {
    if (!languageCode) return [];
    
    // 获取所有唯一的标签slug（从所有语言中收集）
    const allSlugs = new Set<string>();
    Object.values(dictionaries.value.tags).forEach((langTags) => {
      if (langTags) {
        Object.keys(langTags).forEach((slug) => allSlugs.add(slug));
      }
    });
    
    // 为每个slug构建标签数据
    return Array.from(allSlugs).map((slug) => {
      const currentLangData = dictionaries.value.tags[languageCode]?.[slug];
      
      // 如果当前语言存在，直接使用
      if (currentLangData) {
        return {
          slug,
          ...currentLangData,
          languageCode,
        };
      }
      
      // 如果当前语言不存在，回退到默认语言
      if (languageCode !== DEFAULT_LANGUAGE) {
        const defaultLangData = dictionaries.value.tags[DEFAULT_LANGUAGE]?.[slug];
        if (defaultLangData) {
          return {
            slug,
            ...defaultLangData,
            languageCode, // 保持当前语言代码，但使用默认语言的数据
          };
        }
      }
      
      // 如果都不存在，返回基本数据
      return {
      slug,
        name: slug,
      languageCode,
      };
    });
  };

  // 检查是否需要刷新缓存
  const shouldRefresh = (): boolean => {
    if (!lastFetchTime.value) return true;
    return Date.now() - lastFetchTime.value > CACHE_DURATION;
  };

  // 加载所有语言的字典数据（一次性加载）
  const loadDictionaries = async (force = false) => {
    // 如果不需要刷新且不是强制刷新，且已有数据，直接返回
    if (
      !force &&
      !shouldRefresh() &&
      Object.keys(dictionaries.value.categories).length > 0
    ) {
      return;
    }

    loading.value = true;
    try {
      const response: any = await $fetch("/api/dictionaries");

      if (response?.c === 200) {
        // 直接赋值所有语言的数据
        dictionaries.value = response.d;
        lastFetchTime.value = Date.now();
      }
    } catch (error) {
      console.error("加载字典失败", error);
    } finally {
      loading.value = false;
    }
  };

  // 刷新字典数据
  const refreshDictionaries = async () => {
    await loadDictionaries(true);
  };

  // 更新单个分类（创建/更新分类后调用）
  const updateCategory = (slug: string, languageCode: string, data: any) => {
    if (!dictionaries.value.categories[languageCode]) {
      dictionaries.value.categories[languageCode] = {};
    }
    dictionaries.value.categories[languageCode][slug] = data;
  };

  // 更新单个标签（创建/更新标签后调用）
  const updateTag = (slug: string, languageCode: string, data: any) => {
    if (!dictionaries.value.tags[languageCode]) {
      dictionaries.value.tags[languageCode] = {};
    }
    dictionaries.value.tags[languageCode][slug] = data;
  };

  // 删除分类
  const removeCategory = (slug: string, languageCode: string) => {
    if (dictionaries.value.categories[languageCode]) {
      delete dictionaries.value.categories[languageCode][slug];
    }
  };

  // 删除标签
  const removeTag = (slug: string, languageCode: string) => {
    if (dictionaries.value.tags[languageCode]) {
      delete dictionaries.value.tags[languageCode][slug];
    }
  };

  return {
    dictionaries: readonly(dictionaries),
    loading: readonly(loading),
    getCategoryName,
    getTagName,
    getCategory,
    getTag,
    getCategoriesByLanguage,
    getTagsByLanguage,
    loadDictionaries,
    refreshDictionaries,
    updateCategory,
    updateTag,
    removeCategory,
    removeTag,
  };
});
