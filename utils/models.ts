export interface Result<T> {
  c: number;
  m: string;
  d: T;
}

export interface Pagination<T> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: T[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
   // 聚合信息（来自 ArticleBase）
  viewCount?: number;
  bookmarkCount?: number;
  languageCode?: string;
  categorySlug?: string;
  tagSlugs?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeyword?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
    username: string;
    creatorKey?: string;
  };
  availableTranslations?: Array<{
    languageCode: string;
    slug: string;
    title: string;
  }>;
}
