/**
 * 文内广告：在指定容器内渲染 .article-ads 占位（脚本由 default 布局统一加载）
 * 配置来自 /api/system/google-ads（GOOGLE_ADS_ID + GOOGLE_ADS_ARTICLE_ADS_SLOT）
 *
 * 思路对齐 Vanblog 客制化脚本：占位由 Markdown 异步输出，必须在 DOM 真正出现
 * （及 SPA 内被替换）后再写入 ins 并 push。这里用预览容器 MutationObserver，
 * 而不是监听整个 body / footer 高度。
 */

import { computed, isRef } from "vue";
import type { Ref } from "vue";

/** 正文中的文内广告占位，编辑器插入与阅读页渲染共用 */
export const ARTICLE_ADS_CLASS = "article-ads";
export const ARTICLE_ADS_PLACEHOLDER_HTML = `<div class="${ARTICLE_ADS_CLASS}"></div>`;
/** 与 default 布局共用，避免重复请求导致开关状态不同步 */
export const GOOGLE_ADS_FETCH_KEY = "system-google-ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdsContainer = HTMLElement | Ref<HTMLElement | null | undefined>;

function normalizeAdsId(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const numeric = trimmed.replace(/^(?:ca-pub-|pub-)/i, "");
  return /^\d+$/.test(numeric) ? numeric : null;
}

function unwrapContainer(container: AdsContainer): HTMLElement | null {
  const el = isRef(container) ? container.value : container;
  return el ?? null;
}

function hasUnfilledPlaceholders(el: HTMLElement): boolean {
  return Array.from(el.querySelectorAll<HTMLElement>(`.${ARTICLE_ADS_CLASS}`)).some(
    (node) => !node.querySelector("ins.adsbygoogle"),
  );
}

export function useArticleAds() {
  const { data: googleAdsData } = useFetch<{
    c: number;
    d: {
      id: string | null;
      slot: string | null;
      enabled: boolean;
      articleAdsEnabled: boolean;
    };
  }>("/api/system/google-ads", { key: GOOGLE_ADS_FETCH_KEY });

  const adsNumericId = computed(() =>
    normalizeAdsId(googleAdsData.value?.d?.id ?? null),
  );
  const adsClientId = computed(() =>
    adsNumericId.value ? `ca-pub-${adsNumericId.value}` : null,
  );
  const adsSlot = computed(() => googleAdsData.value?.d?.slot?.trim() || null);

  /** 文内广告是否可用：总开关 + 文内开关 + 已配置 ID 与 Slot，脚本由 default 布局加载 */
  const isEnabled = computed(
    () =>
      !!googleAdsData.value?.d?.articleAdsEnabled &&
      !!adsClientId.value &&
      !!adsSlot.value,
  );

  const pendingEls = new WeakSet<HTMLElement>();

  /**
   * 在容器内查找尚未填充的 .article-ads，写入广告单元并 push。
   * 不要求 adsbygoogle.js 已执行完毕：可先入队，脚本加载后会消费队列。
   */
  function renderInArticleAds(container: AdsContainer): void {
    if (import.meta.server || !isEnabled.value) return;
    if (typeof window === "undefined") return;
    const el = unwrapContainer(container);
    if (!el) return;
    const articleAds = el.querySelectorAll<HTMLElement>(`.${ARTICLE_ADS_CLASS}`);
    if (!articleAds.length) return;
    const insHtml = `<ins class="adsbygoogle ads-custome" style="display:block;text-align:center;" data-ad-layout="in-article" data-ad-format="fluid" data-ad-client="${adsClientId.value}" data-ad-slot="${adsSlot.value}"></ins>`;
    articleAds.forEach((node) => {
      if (node.querySelector("ins.adsbygoogle")) return;
      node.innerHTML = insHtml;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (_) {
        // 脚本未就绪时可能报错，忽略
      }
    });
  }

  /** 同一容器在同一轮 DOM 更新里只渲染一次，避免 onRemount 与 observer 双触发重复 push */
  function scheduleRender(container: AdsContainer): void {
    if (import.meta.server || !isEnabled.value) return;
    const el = unwrapContainer(container);
    if (!el) return;
    if (pendingEls.has(el)) return;
    pendingEls.add(el);
    queueMicrotask(() => {
      pendingEls.delete(el);
      renderInArticleAds(el);
    });
  }

  /**
   * 观察预览容器：MdPreview 异步输出或替换 HTML 后，空占位再出现时重新灌广告。
   * 返回停止函数，须在组件卸载时调用。
   */
  function observeAndRender(container: AdsContainer): () => void {
    if (import.meta.server || typeof window === "undefined" || !isEnabled.value) {
      return () => {};
    }

    const el = unwrapContainer(container);
    if (!el) return () => {};

    let debounceTimer: ReturnType<typeof window.setTimeout> | undefined;
    const flush = () => {
      if (hasUnfilledPlaceholders(el)) scheduleRender(el);
    };

    const observer = new MutationObserver(() => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(flush, 80);
    });
    observer.observe(el, { childList: true, subtree: true });
    flush();

    return () => {
      observer.disconnect();
      window.clearTimeout(debounceTimer);
    };
  }

  return {
    isEnabled,
    renderInArticleAds,
    scheduleRender,
    observeAndRender,
  };
}
