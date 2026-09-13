export const useSEO = (options: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}) => {
  const config = useRuntimeConfig();
  const route = useRoute();

  const seoTitle = computed(() => options.title || "i18n Blog");
  const seoDescription = computed(() => options.description || "");
  const seoImage = computed(() => options.image || "");
  const seoUrl = computed(
    () => options.url || `${config.public.siteUrl}${route.path}`
  );

  useSeoMeta({
    title: seoTitle.value,
    description: seoDescription.value,
    ogTitle: seoTitle.value,
    ogDescription: seoDescription.value,
    ogImage: seoImage.value,
    ogUrl: seoUrl.value,
    twitterCard: "summary_large_image",
    twitterTitle: seoTitle.value,
    twitterDescription: seoDescription.value,
    twitterImage: seoImage.value,
  });

  return {
    title: seoTitle,
    description: seoDescription,
    image: seoImage,
    url: seoUrl,
  };
};
