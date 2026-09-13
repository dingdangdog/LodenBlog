<template>
  <div class="flex items-center gap-2">
    <button
      v-for="platform in platforms"
      :key="platform.name"
      @click="share(platform)"
      class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
      :aria-label="`分享到${platform.name}`"
    >
      {{ platform.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface SharePlatform {
  name: string;
  url: string;
}

const props = defineProps<{
  url?: string;
  title?: string;
  description?: string;
}>();

const config = useRuntimeConfig();
const currentUrl = computed(() => props.url || (process.client ? window.location.href : ''));
const shareTitle = computed(() => props.title || '');
const shareDescription = computed(() => props.description || '');

const platforms: SharePlatform[] = [
  {
    name: '微信',
    url: '#',
  },
  {
    name: '微博',
    url: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(currentUrl.value)}&title=${encodeURIComponent(shareTitle.value)}`,
  },
  {
    name: 'Twitter',
    url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl.value)}&text=${encodeURIComponent(shareTitle.value)}`,
  },
  {
    name: 'Facebook',
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl.value)}`,
  },
];

const share = (platform: SharePlatform) => {
  if (process.client && platform.url !== '#') {
    window.open(platform.url, '_blank', 'width=600,height=400');
  }
};
</script>

