<template>
  <div
    class="relative z-0 gap-4 flex flex-col md:flex-row justify-between bg-surface rounded-xl border border-border p-2.5 md:p-5 hover:shadow-lg transition-shadow">
    <NuxtLink :to="articlePath" class="absolute inset-0 z-1"></NuxtLink>

    <!-- 封面图 -->
    <div v-if="article.featuredImage" class="flex-shrink-0 w-full md:w-48 h-32 md:h-28 rounded-lg overflow-hidden">
      <img :src="article.featuredImage" :alt="article.title" class="w-full h-full object-cover" />
    </div>

    <!-- 文章内容 -->
    <div class="flex-1">
      <div class="z-2">
        <NuxtLink
          class="block text-base md:text-xl font-semibold mb-2 text-foreground hover:text-primary-600 transition-colors"
          :to="articlePath">
          {{ article.title }}
        </NuxtLink>
      </div>
      <p v-if="article.excerpt" class="text-sm md:text-base text-muted mb-2 line-clamp-2">
        {{ article.excerpt }}
      </p>
      <div class="z-2 flex flex-wrap items-center gap-2 md:gap-3 text-sm text-muted">
        <!-- 作者信息 -->
        <div class="flex items-center space-x-1">
          <div v-if="article.author" class="relative z-20 flex items-center gap-2">
            <NuxtLink v-if="article.author.creatorKey" :to="localePath(`/author/${article.author.creatorKey}`)"
              v-slot="{ navigate }">
              <div class="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                @click.stop="navigate">
                <img v-if="article.author.avatar" :src="normalizeAvatarUrl(article.author.avatar)"
                  :alt="article.author.name" class="w-6 h-6 rounded-full object-cover border border-border" />
                <div v-else
                  class="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center text-muted text-xs font-medium">
                  {{ article.author.name?.charAt(0)?.toUpperCase() || "?" }}
                </div>
                <span class="font-medium">{{ article.author.name }}</span>
              </div>
            </NuxtLink>
            <div v-else class="flex items-center gap-2">
              <img v-if="article.author.avatar" :src="normalizeAvatarUrl(article.author.avatar)"
                :alt="article.author.name" class="w-6 h-6 rounded-full object-cover border border-border" />
              <div v-else
                class="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center text-muted text-xs font-medium">
                {{ article.author.name?.charAt(0)?.toUpperCase() || "?" }}
              </div>
              <span class="font-medium">{{ article.author.name }}</span>
            </div>
          </div>
          <span v-if="article.author">·</span>
          <span>{{
            formatDate(article.publishedAt || article.createdAt)
          }}</span>
          <span v-if="article.viewCount && article.viewCount > 0">
            · {{ article.viewCount }} {{ $t("article.viewsCount") }}
          </span>
        </div>
        <NuxtLink v-if="article.categorySlug && categoryName" :to="localePath(`/category/${article.categorySlug}`)"
          v-slot="{ navigate }">
          <span
            class="relative z-20 px-2 py-1 rounded text-xs font-medium bg-primary-100 dark:bg-primary-700 text-primary-700 dark:text-primary-100 hover:bg-primary-200 dark:hover:bg-primary-300/90 transition-colors cursor-pointer"
            @click.stop="navigate">
            {{ categoryName }}
          </span>
        </NuxtLink>
        <NuxtLink v-for="(tagName, index) in tagNames" :key="article.tagSlugs?.[index]"
          :to="localePath(`/tag/${article.tagSlugs?.[index]}`)" v-slot="{ navigate }">
          <span
            class="relative z-20 px-2 py-1 rounded text-xs font-medium bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-100 hover:bg-accent-200 dark:hover:bg-accent-400/60 transition-colors cursor-pointer"
            @click.stop="navigate">
            {{ tagName }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { normalizeAvatarUrl } from "~/utils/avatar";
import { formatDate } from "~/utils/common";

interface ArticleAuthor {
  id: string;
  name: string;
  avatar?: string;
  username: string;
  creatorKey?: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  publishedAt?: string | null;
  createdAt: string;
  viewCount?: number;
  categorySlug?: string | null;
  tagSlugs?: string[];
  author?: ArticleAuthor | null;
}

interface Props {
  article: Article;
  categoryName?: string;
  tagNames?: string[];
}

const props = defineProps<Props>();

const localePath = useLocalePath();

const articlePath = computed(() => {
  return localePath(`/post/${props.article.slug}`);
});
</script>
