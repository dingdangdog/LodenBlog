/**
 * 从数据库获取已启用的语言列表，用于语言切换器展示。
 * 若仅有一种语言则不应展示切换器（由调用方根据 list.length 判断）。
 */
export function useEnabledLocales() {
  const { data, error, refresh } = useFetch<{
    c: number;
    m: string;
    d: Array<{ code: string; name: string; nativeName: string }>;
  }>("/api/languages", {
    default: () => ({ c: 200, m: "success", d: [] }),
  });

  const list = computed(() => data.value?.d ?? []);
  const loading = computed(() => !data.value && !error.value);
  const hasMultiple = computed(() => list.value.length > 1);

  return {
    list,
    loading,
    hasMultiple,
    refresh,
  };
}
