import { defineStore } from 'pinia';

export const useI18nStore = defineStore('i18n', () => {
  const currentLanguage = ref('zh');
  const availableLanguages = ref([
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
  ]);

  const setLanguage = (lang: string) => {
    currentLanguage.value = lang;
  };

  return {
    currentLanguage: readonly(currentLanguage),
    availableLanguages: readonly(availableLanguages),
    setLanguage,
  };
});

