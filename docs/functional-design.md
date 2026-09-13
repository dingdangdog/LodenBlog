# 功能代码设计文档

## 1. 数据库设计

> **注意**: 详细的数据库表结构设计请参考 [database-schema.md](./database-schema.md) 文件。

### 1.1 设计概述

数据库设计支持以下核心功能：

- **多语言URL路径**: 支持 `/{languageCode}/post/{slug}` 格式的URL
- **vue-i18n集成**: 通过 `TranslationKey` 表存储翻译文本
- **文章翻译关联**: 通过 `originalId` 字段关联同一文章的不同语言版本
- **完整语言支持**: 支持完整语言代码（如 `zh`, `en-US`, `ja`）

### 1.2 核心表结构

- **User**: 用户管理
- **Language**: 语言配置
- **Article**: 文章内容（支持多语言）
- **Category**: 分类管理（多语言）
- **Tag**: 标签管理（多语言）
- **TranslationKey**: 翻译文本存储（vue-i18n集成）
- **Page**: 静态页面（多语言）
- **Media**: 媒体文件管理
- **Setting**: 系统设置
- **Comment**: 评论系统

### 1.3 URL路径映射

- 文章: `/{languageCode}/post/{slug}`
- 页面: `/{languageCode}/{pageSlug}`
- 分类: `/{languageCode}/category/{categorySlug}`
- 标签: `/{languageCode}/tag/{tagSlug}`

## 2. API设计

### 2.1 认证API

#### 登录接口
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "role": "ADMIN"
    },
    "token": "jwt_token"
  }
}
```

#### 注册接口
```typescript
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "role": "USER"
    }
  }
}
```

### 2.2 文章API

#### 获取文章列表
```typescript
GET /api/articles?lang=zh&page=1&limit=10&category=tech&tag=vue

Response:
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "article_id",
        "slug": "my-name",
        "title": "文章标题",
        "excerpt": "文章摘要",
        "featuredImage": "image_url",
        "publishedAt": "2024-01-01T00:00:00Z",
        "viewCount": 100,
        "seoTitle": "SEO标题",
        "seoDescription": "SEO描述",
        "author": {
          "username": "author_name",
          "avatar": "avatar_url"
        },
        "language": {
          "code": "zh",
          "name": "中文"
        },
        "category": {
          "name": "分类名称",
          "slug": "category-slug"
        },
        "tags": [
          {
            "name": "标签名称",
            "slug": "tag-slug"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

#### 获取文章详情
```typescript
GET /api/articles/[slug]?lang=zh

Response:
{
  "success": true,
  "data": {
    "id": "article_id",
    "slug": "my-name",
    "title": "文章标题",
    "content": "文章内容",
    "excerpt": "文章摘要",
    "featuredImage": "image_url",
    "publishedAt": "2024-01-01T00:00:00Z",
    "viewCount": 100,
    "seoTitle": "SEO标题",
    "seoDescription": "SEO描述",
    "author": {
      "username": "author_name",
      "avatar": "avatar_url",
      "bio": "作者简介"
    },
    "language": {
      "code": "zh",
      "name": "中文"
    },
    "category": {
      "name": "分类名称",
      "slug": "category-slug"
    },
    "tags": [
      {
        "name": "标签名称",
        "slug": "tag-slug"
      }
    ],
    "translations": [
      {
        "language": {
          "code": "en-US",
          "name": "English (US)"
        },
        "slug": "my-name"
      }
    ]
  }
}
```

#### 创建文章
```typescript
POST /api/articles
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "title": "文章标题",
  "content": "文章内容",
  "excerpt": "文章摘要",
  "languageId": "language_id",
  "categoryId": "category_id",
  "tagIds": ["tag_id_1", "tag_id_2"],
  "status": "DRAFT",
  "featuredImage": "image_url"
}

Response:
{
  "success": true,
  "data": {
    "id": "article_id",
    "slug": "generated-slug"
  }
}
```

### 2.3 翻译API

#### 翻译文章
```typescript
POST /api/translations/translate
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "articleId": "article_id",
  "targetLanguageId": "target_language_id",
  "translationService": "google" // google, baidu, deepl
}

Response:
{
  "success": true,
  "data": {
    "translatedArticleId": "translated_article_id"
  }
}
```

#### 获取翻译文本
```typescript
GET /api/translations?lang=zh&namespace=common

Response:
{
  "success": true,
  "data": {
    "common.welcome": "欢迎",
    "common.about": "关于我们",
    "nav.home": "首页",
    "nav.about": "关于"
  }
}
```

#### 更新翻译文本
```typescript
PUT /api/translations
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "key": "common.welcome",
  "value": "欢迎访问",
  "namespace": "common",
  "languageId": "lang_zh"
}

Response:
{
  "success": true,
  "data": {
    "updated": true
  }
}
```

### 2.4 页面API

#### 获取页面列表
```typescript
GET /api/pages?lang=zh

Response:
{
  "success": true,
  "data": [
    {
      "id": "page_id",
      "slug": "about",
      "title": "关于我们",
      "excerpt": "页面摘要",
      "isPublished": true,
      "language": {
        "code": "zh",
        "name": "中文"
      }
    }
  ]
}
```

#### 获取页面详情
```typescript
GET /api/pages/[slug]?lang=zh

Response:
{
  "success": true,
  "data": {
    "id": "page_id",
    "slug": "about",
    "title": "关于我们",
    "content": "页面内容",
    "excerpt": "页面摘要",
    "seoTitle": "SEO标题",
    "seoDescription": "SEO描述",
    "isPublished": true,
    "language": {
      "code": "zh",
      "name": "中文"
    }
  }
}
```

### 2.5 设置API

#### 获取系统设置
```typescript
GET /api/settings?category=general&lang=zh

Response:
{
  "success": true,
  "data": {
    "siteTitle": "网站标题",
    "siteDescription": "网站描述",
    "defaultLanguage": "zh",
    "theme": "light"
  }
}
```

#### 更新系统设置
```typescript
PUT /api/settings
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "siteTitle": "新网站标题",
  "siteDescription": "新网站描述",
  "htmlHead": "<meta name='description' content='...'>",
  "customCSS": ".custom { color: red; }",
  "customJS": "console.log('custom script');"
}

Response:
{
  "success": true,
  "data": {
    "updated": true
  }
}
```

## 3. 组件设计

### 3.1 核心组件架构

#### 基础UI组件
```typescript
// components/ui/Button.vue
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  disabled: boolean
  loading: boolean
  icon?: string
}

// components/ui/Input.vue
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number'
  placeholder: string
  required: boolean
  disabled: boolean
  error?: string
  label?: string
}

// components/ui/Modal.vue
interface ModalProps {
  isOpen: boolean
  title: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  closable: boolean
  persistent: boolean
}
```

#### 博客组件
```typescript
// components/blog/ArticleCard.vue
interface ArticleCardProps {
  article: {
    id: string
    slug: string
    title: string
    excerpt: string
    featuredImage?: string
    publishedAt: string
    viewCount: number
    author: User
    category: Category
    tags: Tag[]
  }
  showAuthor?: boolean
  showCategory?: boolean
  showTags?: boolean
}

// components/blog/ArticleList.vue
interface ArticleListProps {
  articles: Article[]
  loading: boolean
  pagination: Pagination
  showFilters?: boolean
}

// components/blog/SearchBox.vue
interface SearchBoxProps {
  placeholder: string
  onSearch: (query: string) => void
  suggestions?: string[]
}
```

#### 国际化组件
```typescript
// components/i18n/LanguageSwitcher.vue
interface LanguageSwitcherProps {
  currentLanguage: string
  availableLanguages: Language[]
  showFlags?: boolean
  showNames?: boolean
  position: 'header' | 'footer' | 'sidebar'
}

// components/i18n/TranslationEditor.vue
interface TranslationEditorProps {
  originalContent: string
  translatedContent: string
  sourceLanguage: string
  targetLanguage: string
  onSave: (content: string) => void
  onTranslate: () => void
}
```

#### 主题组件
```typescript
// components/theme/ThemeToggle.vue
interface ThemeToggleProps {
  currentTheme: 'light' | 'dark' | 'system'
  showLabel?: boolean
  size: 'sm' | 'md' | 'lg'
}

// components/theme/ThemeProvider.vue
interface ThemeProviderProps {
  defaultTheme: 'light' | 'dark' | 'system'
  storageKey: string
  enableSystem: boolean
}
```

### 3.2 布局组件设计

#### 主布局 (layouts/default.vue)
```vue
<template>
  <div class="min-h-screen bg-background">
    <!-- 头部 -->
    <AppHeader />
    
    <!-- 主要内容 -->
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
    
    <!-- 底部 -->
    <AppFooter />
    
    <!-- 全局组件 -->
    <NotificationContainer />
    <LoadingOverlay />
  </div>
</template>
```

#### 管理后台布局 (layouts/admin.vue)
```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <AdminSidebar :is-collapsed="sidebarCollapsed" />
    
    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部导航 -->
      <AdminHeader @toggle-sidebar="toggleSidebar" />
      
      <!-- 页面内容 -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
```

## 4. 状态管理设计

### 4.1 Pinia Store设计

#### 认证状态 (stores/auth.ts)
```typescript
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  
  const login = async (credentials: LoginCredentials) => {
    // 登录逻辑
  }
  
  const logout = async () => {
    // 登出逻辑
  }
  
  const refreshToken = async () => {
    // 刷新token逻辑
  }
  
  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    login,
    logout,
    refreshToken
  }
})
```

#### 国际化状态 (stores/i18n.ts)
```typescript
export const useI18nStore = defineStore('i18n', () => {
  const currentLanguage = ref<string>('zh')
  const availableLanguages = ref<Language[]>([])
  const translations = ref<Record<string, Record<string, string>>>({})
  
  const setLanguage = async (languageCode: string) => {
    currentLanguage.value = languageCode
    await loadTranslations(languageCode)
    // 更新vue-i18n实例
    if (process.client) {
      const { $i18n } = useNuxtApp()
      $i18n.setLocale(languageCode)
    }
  }
  
  const loadTranslations = async (languageCode: string) => {
    try {
      const { data } = await $fetch(`/api/translations?lang=${languageCode}`)
      translations.value[languageCode] = data
      
      // 更新vue-i18n实例
      if (process.client) {
        const { $i18n } = useNuxtApp()
        $i18n.setLocaleMessage(languageCode, data)
      }
    } catch (error) {
      console.error('Failed to load translations:', error)
    }
  }
  
  const loadAllTranslations = async () => {
    const languages = availableLanguages.value
    for (const lang of languages) {
      await loadTranslations(lang.code)
    }
  }
  
  const t = (key: string, params?: Record<string, any>) => {
    if (process.client) {
      const { $i18n } = useNuxtApp()
      return $i18n.t(key, params)
    }
    // 服务端渲染时的翻译逻辑
    const langTranslations = translations.value[currentLanguage.value]
    return langTranslations?.[key] || key
  }
  
  return {
    currentLanguage: readonly(currentLanguage),
    availableLanguages: readonly(availableLanguages),
    translations: readonly(translations),
    setLanguage,
    loadTranslations,
    loadAllTranslations,
    t
  }
})
```

#### 主题状态 (stores/theme.ts)
```typescript
export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<'light' | 'dark' | 'system'>('system')
  const isDark = ref<boolean>(false)
  
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    // 设置主题逻辑
  }
  
  const toggleTheme = () => {
    // 切换主题逻辑
  }
  
  const detectSystemTheme = () => {
    // 检测系统主题逻辑
  }
  
  return {
    currentTheme: readonly(currentTheme),
    isDark: readonly(isDark),
    setTheme,
    toggleTheme,
    detectSystemTheme
  }
})
```

## 5. 中间件设计

### 5.1 认证中间件 (middleware/auth.ts)
```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return navigateTo('/login')
  }
})
```

### 5.2 国际化中间件 (middleware/i18n.ts)
```typescript
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { setLanguage, availableLanguages } = useI18nStore()
  const route = useRoute()
  
  // 从URL路径中提取语言代码
  // 支持格式: /{lang}/post/{slug}, /{lang}/{page}, /{lang}/category/{slug}
  const pathSegments = to.path.split('/').filter(Boolean)
  const languageCode = pathSegments[0]
  
  // 验证语言代码是否有效
  const isValidLanguage = availableLanguages.value.some(lang => lang.code === languageCode)
  
  if (languageCode && isValidLanguage) {
    await setLanguage(languageCode)
  } else if (languageCode && !isValidLanguage) {
    // 无效语言代码，重定向到默认语言
    const defaultLang = availableLanguages.value.find(lang => lang.isDefault)?.code || 'zh'
    const newPath = to.path.replace(`/${languageCode}`, `/${defaultLang}`)
    return navigateTo(newPath)
  } else {
    // 没有语言代码，重定向到默认语言
    const defaultLang = availableLanguages.value.find(lang => lang.isDefault)?.code || 'zh'
    return navigateTo(`/${defaultLang}${to.path}`)
  }
})
```

### 5.3 初始化中间件 (middleware/init.ts)
```typescript
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { data: initStatus } = await $fetch('/api/init/status')
  
  if (!initStatus.isInitialized && !to.path.startsWith('/init')) {
    return navigateTo('/init')
  }
})
```

## 6. 插件设计

### 6.1 Prisma客户端插件 (plugins/prisma.client.ts)
```typescript
export default defineNuxtPlugin(() => {
  const prisma = new PrismaClient()
  
  return {
    provide: {
      prisma
    }
  }
})
```

### 6.2 国际化插件 (plugins/i18n.client.ts)
```typescript
export default defineNuxtPlugin(async () => {
  const { loadTranslations, setLanguage, availableLanguages } = useI18nStore()
  const { $i18n } = useNuxtApp()
  
  // 初始化语言
  const savedLanguage = localStorage.getItem('language') || 'zh'
  
  // 设置vue-i18n的默认语言
  $i18n.setLocale(savedLanguage)
  
  // 加载所有语言的翻译
  await loadTranslations(savedLanguage)
  
  // 监听语言变化
  watch(() => $i18n.locale.value, async (newLocale) => {
    await setLanguage(newLocale)
    localStorage.setItem('language', newLocale)
  })
})
```

### 6.3 主题插件 (plugins/theme.client.ts)
```typescript
export default defineNuxtPlugin(() => {
  const { detectSystemTheme, setTheme } = useThemeStore()
  
  // 检测系统主题
  detectSystemTheme()
  
  // 监听系统主题变化
  if (process.client) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', detectSystemTheme)
  }
})
```

## 7. 工具函数设计

### 7.1 SEO工具 (utils/seo.ts)
```typescript
export const generateSeoMeta = (data: {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
  locale?: string
}) => {
  return {
    title: data.title,
    meta: [
      { name: 'description', content: data.description },
      { property: 'og:title', content: data.title },
      { property: 'og:description', content: data.description },
      { property: 'og:type', content: data.type || 'website' },
      { property: 'og:url', content: data.url },
      { property: 'og:image', content: data.image },
      { property: 'og:locale', content: data.locale },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: data.title },
      { name: 'twitter:description', content: data.description },
      { name: 'twitter:image', content: data.image }
    ]
  }
}
```

### 7.2 翻译工具 (utils/translation.ts)
```typescript
export class TranslationService {
  private apiKey: string
  private service: 'google' | 'baidu' | 'deepl'
  
  constructor(service: string, apiKey: string) {
    this.service = service as any
    this.apiKey = apiKey
  }
  
  async translate(text: string, from: string, to: string): Promise<string> {
    switch (this.service) {
      case 'google':
        return this.translateWithGoogle(text, from, to)
      case 'baidu':
        return this.translateWithBaidu(text, from, to)
      case 'deepl':
        return this.translateWithDeepL(text, from, to)
      default:
        throw new Error('Unsupported translation service')
    }
  }
  
  private async translateWithGoogle(text: string, from: string, to: string): Promise<string> {
    // Google翻译API实现
  }
  
  private async translateWithBaidu(text: string, from: string, to: string): Promise<string> {
    // 百度翻译API实现
  }
  
  private async translateWithDeepL(text: string, from: string, to: string): Promise<string> {
    // DeepL翻译API实现
  }
}
```

### 7.3 文件上传工具 (utils/file-upload.ts)
```typescript
export class FileUploadService {
  private maxSize: number
  private allowedTypes: string[]
  
  constructor(maxSize = 10 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) {
    this.maxSize = maxSize
    this.allowedTypes = allowedTypes
  }
  
  async uploadFile(file: File): Promise<{ url: string; path: string }> {
    // 验证文件
    this.validateFile(file)
    
    // 生成唯一文件名
    const filename = this.generateFilename(file)
    
    // 上传文件
    const formData = new FormData()
    formData.append('file', file)
    formData.append('filename', filename)
    
    const response = await $fetch('/api/media/upload', {
      method: 'POST',
      body: formData
    })
    
    return response
  }
  
  private validateFile(file: File): void {
    if (file.size > this.maxSize) {
      throw new Error('File size exceeds limit')
    }
    
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed')
    }
  }
  
  private generateFilename(file: File): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const extension = file.name.split('.').pop()
    return `${timestamp}_${random}.${extension}`
  }
}
```

## 8. 配置系统设计

### 8.1 动态配置注入
```typescript
// composables/useConfig.ts
export const useConfig = () => {
  const config = ref<SystemConfig>({})
  
  const loadConfig = async () => {
    const { data } = await $fetch('/api/settings')
    config.value = data
  }
  
  const injectHtmlHead = () => {
    if (process.client && config.value.htmlHead) {
      const head = document.head
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = config.value.htmlHead
      
      while (tempDiv.firstChild) {
        head.appendChild(tempDiv.firstChild)
      }
    }
  }
  
  const injectCustomCSS = () => {
    if (process.client && config.value.customCSS) {
      const style = document.createElement('style')
      style.textContent = config.value.customCSS
      document.head.appendChild(style)
    }
  }
  
  const injectCustomJS = () => {
    if (process.client && config.value.customJS) {
      const script = document.createElement('script')
      script.textContent = config.value.customJS
      document.head.appendChild(script)
    }
  }
  
  return {
    config: readonly(config),
    loadConfig,
    injectHtmlHead,
    injectCustomCSS,
    injectCustomJS
  }
}
```

## 9. 性能优化设计

### 9.1 缓存策略
```typescript
// utils/cache.ts
export class CacheManager {
  private cache = new Map<string, { data: any; expires: number }>()
  
  set(key: string, data: any, ttl = 300000): void { // 5分钟默认TTL
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear(): void {
    this.cache.clear()
  }
}
```

### 9.2 图片优化
```typescript
// utils/image.ts
export const optimizeImage = (url: string, options: {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
} = {}): string => {
  const params = new URLSearchParams()
  
  if (options.width) params.set('w', options.width.toString())
  if (options.height) params.set('h', options.height.toString())
  if (options.quality) params.set('q', options.quality.toString())
  if (options.format) params.set('f', options.format)
  
  return `${url}?${params.toString()}`
}
```

## 10. 错误处理设计

### 10.1 全局错误处理
```typescript
// plugins/error-handler.client.ts
export default defineNuxtPlugin(() => {
  const { $router } = useNuxtApp()
  
  // 全局错误处理
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    // 发送错误报告到监控服务
  })
  
  // 未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    // 发送错误报告到监控服务
  })
})
```

### 10.2 API错误处理
```typescript
// utils/api.ts
export const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await $fetch(url, options)
    return response
  } catch (error: any) {
    // 统一错误处理
    if (error.status === 401) {
      // 未授权，跳转到登录页
      await navigateTo('/login')
    } else if (error.status === 403) {
      // 权限不足
      throw new Error('权限不足')
    } else if (error.status >= 500) {
      // 服务器错误
      throw new Error('服务器错误，请稍后重试')
    } else {
      // 其他错误
      throw new Error(error.message || '请求失败')
    }
  }
}
```

这个功能代码设计文档涵盖了数据库设计、API设计、组件设计、状态管理、中间件、插件、工具函数、配置系统、性能优化和错误处理等各个方面，为项目的具体实现提供了详细的技术指导。
