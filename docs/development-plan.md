# 项目开发方案

## 一、项目现状分析

### 1.1 已完成部分
- ✅ 基础项目结构搭建（Nuxt 3 + Prisma + TailwindCSS）
- ✅ 数据库 Schema 设计（Prisma）
- ✅ Cloudflare R2 工具类实现（`server/utils/r2.ts`）
- ✅ API 路由结构搭建（部分占位符）
- ✅ 响应工具类（`server/utils/result.ts`）
- ✅ 基础配置文件（`nuxt.config.ts`）

### 1.2 不符合要求的地方

#### 1.2.1 数据库 Schema 问题
1. **缺少 Creator 表**
   - README 要求：普通用户表和创作者表分开
   - 现状：只有 User 表，使用 role 字段区分角色
   - 需要：创建独立的 Creator 表，存储创作者的笔名、头像等信息

2. **显式关系定义**
   - README 要求：不希望表有显式的关系定义（主外键等），采用开发约定的方式
   - 现状：Schema 中使用了 `@relation` 和 `references`
   - 需要：移除所有显式关系定义，保留字段但去掉 Prisma 关系

3. **缺少翻译配置表**
   - README 要求：可选择多语言翻译渠道并配置 API 密钥
   - 现状：Setting 表没有翻译渠道配置字段
   - 需要：扩展 Setting 表或创建 TranslationConfig 表

4. **缺少点赞功能表**
   - README 要求：需要支持点赞功能
   - 现状：没有 Like 表
   - 需要：创建 ArticleLike 表

#### 1.2.2 配置缺失
1. **i18n 配置缺失**
   - `nuxt.config.ts` 中引入了 `@nuxtjs/i18n`，但没有配置
   - 需要：配置 i18n 模块，设置语言路由、默认语言等

2. **认证配置缺失**
   - `nuxt.config.ts` 中引入了 `@sidebase/nuxt-auth`，但没有配置
   - 需要：配置认证模块，设置 JWT、会话等

#### 1.2.3 前端完全缺失
- `app/pages` 目录为空
- `app/components` 目录为空
- `app/stores` 目录为空
- `app/layouts` 目录为空
- `app/app.vue` 只有默认的 NuxtWelcome

#### 1.2.4 API 实现不完整
- 大部分 API 只是占位符（返回 "not implemented"）
- 需要完整实现所有 API 端点

#### 1.2.5 功能缺失
1. **多语言翻译渠道配置**
   - 需要：翻译 API 配置界面和存储
   - 需要：翻译服务集成（Google Translate、百度翻译等）

2. **Markdown 编辑器**
   - README 要求：需要选择一种好用的开源的支持 nuxt（vue3）的 markdown 编辑器
   - 推荐：`@toast-ui/vue-editor` 或 `@bytemd/vue-next`

3. **主题切换功能**
   - README 要求：需要提供明暗主题切换的功能
   - 需要：创建主题 Store、主题切换组件

4. **SEO 和社交媒体分享**
   - README 要求：需要有良好的 SEO，支持主要的社交媒体分享卡片
   - 需要：SEO meta 标签生成、Open Graph、Twitter Cards

5. **分类的 i18n 实现**
   - README 要求：博文分类的 i18n 需要设计
   - 现状：Category 表已有 languageId，但需要确认实现方案
   - 建议：采用与文章相同的多语言方案，每个语言有独立的分类记录

## 二、详细开发方案

### 2.1 数据库 Schema 调整

#### 2.1.1 移除显式关系定义
**方案**：保留所有外键字段，但移除 Prisma 的 `@relation` 和 `references`，改为手动管理关系。

**影响范围**：
- User 模型
- Article 模型
- Category 模型
- Tag 模型
- Comment 模型
- Media 模型
- Setting 模型
- Page 模型

**示例修改**：
```prisma
// 修改前
author User @relation(fields: [authorId], references: [id])

// 修改后
authorId String @db.VarChar(36)
// 注释：手动关联 User 表
```

#### 2.1.2 创建 Creator 表
```prisma
model Creator {
  id          String   @id @default(cuid()) @db.VarChar(36)
  userId      String   @unique @db.VarChar(36)  // 关联 User.id
  penName     String   @db.VarChar(100)          // 笔名
  avatar      String?  @db.VarChar(500)          // 创作者头像
  bio         String?  @db.Text                   // 创作者简介
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("creators")
}
```

#### 2.1.3 创建翻译配置表
```prisma
model TranslationConfig {
  id          String   @id @default(cuid()) @db.VarChar(36)
  provider    String   @db.VarChar(50)    // google, baidu, deepl 等
  apiKey      String   @db.VarChar(500)   // API 密钥
  apiSecret   String?  @db.VarChar(500)   // API 密钥（如果需要）
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("translation_configs")
}
```

#### 2.1.4 创建点赞表
```prisma
model ArticleLike {
  id        String   @id @default(cuid()) @db.VarChar(36)
  articleId String   @db.VarChar(36)
  userId    String?  @db.VarChar(36)      // 登录用户
  ipAddress String?  @db.VarChar(45)      // 未登录用户的 IP
  createdAt DateTime @default(now())

  @@unique([articleId, userId])
  @@unique([articleId, ipAddress])
  @@index([articleId])
  @@map("article_likes")
}
```

#### 2.1.5 扩展 Setting 表
添加多语言功能开关和翻译相关配置：
```prisma
model Setting {
  // ... 现有字段 ...
  
  // 多语言功能配置
  i18nEnabled      Boolean  @default(false)
  primaryLanguage  String?  @db.VarChar(10)  // 主语言代码
  targetLanguages  String?  @db.Text         // 目标语言代码列表（JSON）
  
  // HTML/CSS/JS 注入
  customHead       String?  @db.Text         // HTML head 注入
  customCSS        String?  @db.Text         // 自定义 CSS
  customJS         String?  @db.Text         // 自定义 JavaScript
  
  // ... 其他字段 ...
}
```

### 2.2 Nuxt 配置完善

#### 2.2.1 i18n 配置
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // ... 其他配置 ...
  
  i18n: {
    locales: [
      { code: 'zh', name: '中文', iso: 'zh-CN' },
      { code: 'en', name: 'English', iso: 'en-US' },
      { code: 'ja', name: '日本語', iso: 'ja-JP' },
    ],
    defaultLocale: 'zh',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    vueI18n: './i18n.config.ts',
  },
})
```

#### 2.2.2 认证配置
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // ... 其他配置 ...
  
  auth: {
    baseURL: process.env.AUTH_ORIGIN,
    provider: {
      type: 'authjs',
    },
  },
})
```

### 2.3 前端开发计划

#### 2.3.1 目录结构
```
app/
├── pages/
│   ├── [lang]/
│   │   ├── index.vue              # 首页
│   │   ├── post/
│   │   │   └── [slug].vue         # 文章详情
│   │   ├── category/
│   │   │   └── [slug].vue         # 分类页面
│   │   ├── tag/
│   │   │   └── [slug].vue         # 标签页面
│   │   └── [pageSlug].vue         # 静态页面
│   ├── admin/                     # 后台管理
│   │   ├── index.vue
│   │   ├── articles/
│   │   ├── categories/
│   │   ├── tags/
│   │   ├── media/
│   │   ├── settings/
│   │   └── translation/
│   └── init/                      # 初始化向导
│       ├── index.vue
│       ├── language.vue
│       ├── admin.vue
│       └── complete.vue
├── components/
│   ├── common/
│   │   ├── Header.vue
│   │   ├── Footer.vue
│   │   ├── LanguageSwitcher.vue
│   │   ├── ThemeToggle.vue
│   │   └── ShareButtons.vue
│   ├── article/
│   │   ├── ArticleCard.vue
│   │   ├── ArticleList.vue
│   │   ├── ArticleContent.vue
│   │   └── ArticleComments.vue
│   └── editor/
│       └── MarkdownEditor.vue
├── layouts/
│   ├── default.vue
│   └── admin.vue
├── stores/
│   ├── auth.ts
│   ├── theme.ts
│   ├── i18n.ts
│   └── app.ts
└── composables/
    ├── useAuth.ts
    ├── useTheme.ts
    └── useSEO.ts
```

#### 2.3.2 核心功能实现优先级

**P0 - 核心功能（必须）**
1. 数据库 Schema 调整（移除关系定义、添加 Creator、TranslationConfig、ArticleLike）
2. i18n 配置和基础路由
3. 认证系统实现（登录、注册、JWT）
4. 基础布局和导航
5. 文章列表和详情页
6. 后台管理基础框架

**P1 - 重要功能（优先）**
1. Markdown 编辑器集成
2. 主题切换功能
3. 媒体上传和管理
4. 分类和标签管理
5. 评论系统
6. 点赞功能

**P2 - 增强功能（后续）**
1. 自动翻译功能
2. SEO 优化和社交媒体分享
3. 翻译配置管理界面
4. 初始化向导
5. 高级设置（HTML/CSS/JS 注入）

### 2.4 API 实现计划

#### 2.4.1 认证 API（P0）
- [ ] POST /api/auth/login - 登录
- [ ] POST /api/auth/register - 注册
- [ ] POST /api/auth/logout - 登出
- [ ] GET /api/me - 获取当前用户信息
- [ ] PATCH /api/me - 更新用户信息

#### 2.4.2 文章 API（P0）
- [ ] GET /api/articles - 文章列表
- [ ] GET /api/articles/[slug] - 文章详情
- [ ] POST /api/articles - 创建文章
- [ ] PATCH /api/articles/[id] - 更新文章
- [ ] DELETE /api/articles/[id] - 删除文章
- [ ] POST /api/articles/[id]/translate - 翻译文章

#### 2.4.3 分类和标签 API（P1）
- [ ] GET /api/categories - 分类列表
- [ ] POST /api/categories - 创建分类
- [ ] PATCH /api/categories/[id] - 更新分类
- [ ] DELETE /api/categories/[id] - 删除分类
- [ ] GET /api/tags - 标签列表
- [ ] POST /api/tags - 创建标签

#### 2.4.4 媒体 API（P1）
- [ ] POST /api/media/upload - 上传媒体
- [ ] GET /api/media - 媒体列表
- [ ] DELETE /api/media/[id] - 删除媒体

#### 2.4.5 评论 API（P1）
- [ ] GET /api/articles/[slug]/comments - 获取评论
- [ ] POST /api/articles/[slug]/comments - 发表评论
- [ ] PATCH /api/comments/[id]/approve - 审核评论
- [ ] DELETE /api/comments/[id] - 删除评论

#### 2.4.6 点赞 API（P1）
- [ ] POST /api/articles/[id]/like - 点赞
- [ ] DELETE /api/articles/[id]/like - 取消点赞
- [ ] GET /api/articles/[id]/likes - 获取点赞数

#### 2.4.7 设置 API（P2）
- [ ] GET /api/settings - 获取设置
- [ ] PUT /api/settings - 更新设置
- [ ] GET /api/settings/translation - 获取翻译配置
- [ ] PUT /api/settings/translation - 更新翻译配置

### 2.5 分类 i18n 实现方案

**推荐方案：与文章相同的多语言方案**

**设计思路**：
1. Category 表已包含 `languageId` 字段，每个语言有独立的分类记录
2. 使用 `slug` + `languageId` 唯一约束确保同一语言下分类唯一
3. 通过 `parentId` 支持分类层级结构（每个语言独立）
4. 如果需要跨语言关联，可以添加 `originalId` 字段（类似 Article）

**实现要点**：
- 创建分类时，需要为每个目标语言创建对应的分类记录
- 分类名称和描述需要翻译
- 前端显示时，根据当前语言筛选分类
- 后台管理时，可以批量翻译分类

### 2.6 Markdown 编辑器选择

**推荐：@bytemd/vue-next**

**理由**：
1. 专为 Vue 3 设计，支持 Nuxt 3
2. 插件生态丰富（数学公式、代码高亮、表格等）
3. 支持图片上传
4. 性能优秀，支持 SSR
5. 中文文档完善

**备选：@toast-ui/vue-editor**
- 功能全面但体积较大
- Vue 3 支持需要额外配置

### 2.7 主题切换实现

**方案**：
1. 使用 Pinia Store 管理主题状态
2. 使用 TailwindCSS 的 `dark:` 前缀实现暗色主题
3. 通过 `class` 或 `media` 策略切换主题
4. 使用 `localStorage` 持久化用户选择
5. 支持跟随系统主题

**实现步骤**：
1. 创建 `app/stores/theme.ts`
2. 创建 `app/components/common/ThemeToggle.vue`
3. 在 `app.vue` 或布局中应用主题类
4. 配置 TailwindCSS 支持暗色模式

### 2.8 SEO 和社交媒体分享

**实现内容**：
1. 使用 `useSeoMeta` 和 `useHead` 设置 meta 标签
2. 实现 Open Graph 标签
3. 实现 Twitter Cards
4. 实现结构化数据（JSON-LD）
5. 创建分享组件（微信、微博、Twitter、Facebook 等）

**工具**：
- Nuxt 3 内置 SEO 工具
- `@nuxtjs/seo` 模块（可选）

## 三、开发步骤建议

### 第一阶段：基础架构（1-2周）
1. 调整数据库 Schema（移除关系定义、添加新表）
2. 完善 Nuxt 配置（i18n、auth）
3. 实现基础认证 API
4. 创建基础布局和导航
5. 实现语言切换功能

### 第二阶段：内容管理（2-3周）
1. 实现文章 CRUD API
2. 实现文章列表和详情页
3. 集成 Markdown 编辑器
4. 实现媒体上传功能
5. 实现分类和标签管理

### 第三阶段：交互功能（1-2周）
1. 实现评论系统
2. 实现点赞功能
3. 实现主题切换
4. 优化用户体验

### 第四阶段：高级功能（2-3周）
1. 实现自动翻译功能
2. 实现 SEO 优化
3. 实现社交媒体分享
4. 实现后台管理界面完善

### 第五阶段：优化和测试（1周）
1. 性能优化
2. 错误处理完善
3. 测试和修复
4. 文档完善

## 四、技术选型确认

### 4.1 Markdown 编辑器
- **主选**：@bytemd/vue-next
- **备选**：@toast-ui/vue-editor

### 4.2 翻译服务
- Google Translate API
- 百度翻译 API
- DeepL API（可选）

### 4.3 主题方案
- TailwindCSS 暗色模式
- 使用 `class` 策略

### 4.4 SEO 方案
- Nuxt 3 内置 SEO 工具
- 手动实现 Open Graph 和 Twitter Cards

## 五、注意事项

1. **数据库迁移**：Schema 调整后需要创建迁移文件并执行
2. **API 兼容性**：确保 API 响应格式统一使用 `result.ts` 工具
3. **权限控制**：所有需要权限的 API 都要实现权限检查
4. **错误处理**：统一错误处理机制，返回友好的错误信息
5. **性能优化**：注意数据库查询优化，避免 N+1 问题
6. **安全性**：密码加密、JWT 安全、SQL 注入防护等

## 六、待确认问题

1. Creator 表的详细字段需求（是否需要更多字段？）
2. 翻译服务的优先级（先实现哪个？）
3. 分类是否需要跨语言关联（originalId）？
4. 点赞是否需要防刷机制（IP 限制、时间限制）？
5. 评论是否需要审核机制（已设计，确认流程）？

