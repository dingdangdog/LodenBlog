# 文章表结构重构方案

## 一、当前设计分析

### 当前表结构
当前 `Article` 模型将所有信息（基础信息和多语言内容）都存储在一个表中：

```prisma
model Article {
  // 基础信息（应该跨语言共享）
  id             String
  featuredImage  String?   // 封面图 - 应该共享
  status         String    // 状态 - 应该共享
  isPublished    Boolean   // 是否发布 - 应该共享
  publishedAt    DateTime? // 发布时间 - 应该共享
  viewCount      Int       // 浏览次数 - 应该共享
  authorId       String    // 作者 - 应该共享
  categoryId     String?   // 分类 - 应该共享
  
  // 多语言内容（应该按语言分离）
  slug           String    // URL标识 - 按语言不同
  title          String    // 标题 - 按语言不同
  content        String    // 内容 - 按语言不同
  excerpt        String?   // 摘要 - 按语言不同
  seoTitle       String?   // SEO标题 - 按语言不同
  seoDescription String?   // SEO描述 - 按语言不同
  seoKeyword     String?   // SEO关键词 - 按语言不同
  
  languageId     String    // 语言ID
  originalId     String?   // 原文ID（用于翻译关联）
}
```

### 当前设计的问题

1. **基础信息重复**：每个语言版本都独立存储 `featuredImage`、`viewCount`、`status`、`isPublished` 等，导致：
   - 更新封面图需要在所有语言版本中更新
   - 浏览次数分散在不同语言版本中
   - 状态管理复杂，可能出现不同语言版本状态不一致

2. **数据一致性风险**：由于基础信息分散，容易出现：
   - 不同语言版本的发布状态不一致
   - 封面图不同步
   - 统计数据不准确

3. **维护成本高**：每次更新基础信息都需要同步所有语言版本

## 二、重构目标

### 2.1 表结构拆分
将文章表拆分为两个表：
1. **ArticleBase（基础信息表）**：存储跨语言共享的基础信息
2. **ArticleContent（文章内容表）**：存储不同语言的具体内容

### 2.2 语言关联优化
**重要优化**：将 `languageId`（UUID）改为 `languageCode`（字符串代码）直接关联

**当前问题**：
- 前端只知道语言代码（如 "zh", "en", "ja"），不知道数据库中的 `languageId`
- 每次查询都需要先通过 `languageId` 查找语言，再查询业务数据
- 需要额外的 JOIN 操作，降低查询效率

**优化方案**：
- 所有业务表直接使用 `languageCode`（如 "zh", "en", "ja"）关联
- 语言代码与 `nuxt.config.ts` 中配置的语言代码保持一致
- 避免每次查询都需要 JOIN Language 表
- 提高查询效率，简化前端逻辑

## 三、新表结构设计

### 3.1 ArticleBase（基础信息表）

存储无论什么语言环境下通用的基本信息：

```prisma
model ArticleBase {
  id             String    @id @default(cuid()) @db.VarChar(36)
  
  // 基础信息（跨语言共享）
  featuredImage  String?   @db.VarChar(500)      // 封面图
  status         String    @default("DRAFT") @db.VarChar(20)  // 状态：DRAFT/PUBLISHED/ARCHIVED
  isPublished    Boolean   @default(false)        // 是否发布
  publishedAt    DateTime?                       // 发布时间
  viewCount      Int       @default(0)            // 浏览次数（所有语言版本累计）
  
  // 关联信息
  authorId       String    @db.VarChar(36)        // 作者ID
  categoryId     String?   @db.VarChar(36)       // 分类ID（可选，如果分类也支持多语言，可能需要调整）
  
  // 时间戳
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  @@index([authorId])
  @@index([categoryId])
  @@index([status, publishedAt])
  @@index([isPublished, publishedAt])
  @@map("article_bases")
}
```

### 3.2 ArticleContent（文章内容表）

存储文章不同语言的正文、标题等可供用户阅读的内容：

```prisma
model ArticleContent {
  id             String    @id @default(cuid()) @db.VarChar(36)
  
  // 关联到基础信息表
  articleBaseId  String    @db.VarChar(36)       // 关联到 ArticleBase
  languageCode   String    @db.VarChar(10)       // 语言代码（如 "zh", "en", "ja"），直接使用代码而非ID
  
  // 多语言内容
  slug           String    @db.VarChar(200)       // URL友好标识符
  title          String    @db.VarChar(200)       // 标题
  content        String    @db.Text               // 正文内容
  excerpt        String?   @db.Text               // 摘要
  seoTitle       String?   @db.VarChar(200)       // SEO标题
  seoDescription String?   @db.VarChar(500)       // SEO描述
  seoKeyword     String?   @db.VarChar(500)       // SEO关键词
  
  // 时间戳
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  @@unique([articleBaseId, languageCode])         // 每个基础文章在每个语言下只能有一个内容版本
  @@unique([slug, languageCode])                  // slug 在同一语言下唯一
  @@index([articleBaseId])
  @@index([languageCode])
  @@index([languageCode, slug])
  @@map("article_contents")
}
```

**注意**：使用 `languageCode` 替代 `languageId`，直接使用语言代码（如 "zh", "en", "ja"），与 `nuxt.config.ts` 中的配置保持一致。

### 3.3 关联关系说明

- 一个 `ArticleBase` 可以对应多个 `ArticleContent`（不同语言版本）
- 每个 `ArticleContent` 必须关联到一个 `ArticleBase`
- 每个 `ArticleBase` 在每个语言下只能有一个 `ArticleContent`
- **语言关联**：使用 `languageCode`（如 "zh", "en", "ja"）直接关联，无需 JOIN Language 表

### 3.4 Language 表调整

`Language` 表需要确保 `code` 字段与 `nuxt.config.ts` 中的语言代码完全一致：

```prisma
model Language {
  id         String   @id @default(cuid()) @db.VarChar(36)
  code       String   @unique @db.VarChar(10)  // 语言代码（如 "zh", "en", "ja"），必须与 nuxt.config.ts 一致
  name       String   @db.VarChar(50)          // 语言名称（如 "中文", "English"）
  nativeName String   @db.VarChar(50)          // 本地名称
  flag       String?  @db.VarChar(500)
  isActive   Boolean  @default(true)
  isDefault  Boolean  @default(false)
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([code])  // 为 code 添加索引以提高查询效率
  @@map("languages")
}
```

**重要约束**：
- `Language.code` 必须与 `nuxt.config.ts` 中配置的语言代码完全一致
- 业务表直接使用 `languageCode` 字段存储语言代码
- 查询时直接使用语言代码，无需先查询 Language 表获取 ID

## 四、数据迁移方案

### 4.1 迁移步骤

1. **创建新表**
   - 创建 `article_bases` 表
   - 创建 `article_contents` 表（使用 `languageCode` 字段）

2. **语言代码迁移**
   - 确保 `languages` 表中的 `code` 字段与 `nuxt.config.ts` 中的语言代码完全一致
   - 为 `languages.code` 添加索引以提高查询效率

3. **数据迁移**
   - 将现有 `articles` 表的数据拆分：
     - 基础信息 → `article_bases`
     - 内容信息 → `article_contents`（将 `languageId` 转换为 `languageCode`）
   - **关键步骤**：将 `languageId` 转换为 `languageCode`：
     ```sql
     -- 迁移时需要通过 JOIN 获取语言代码
     INSERT INTO article_contents (id, article_base_id, language_code, slug, title, ...)
     SELECT 
       a.id,
       ab.id as article_base_id,
       l.code as language_code,  -- 将 languageId 转换为 languageCode
       a.slug,
       a.title,
       ...
     FROM articles a
     JOIN languages l ON a.language_id = l.id
     JOIN article_bases ab ON ...
     ```
   - 处理 `originalId` 关系：
     - 如果文章 A 的 `originalId` 指向文章 B，则：
       - 找到文章 B 对应的 `articleBaseId`
       - 将文章 A 的 `articleBaseId` 设置为文章 B 的 `articleBaseId`
       - 这样所有翻译版本共享同一个基础信息

4. **其他表迁移**
   - `categories` 表：将 `languageId` 转换为 `languageCode`
   - `tags` 表：将 `languageId` 转换为 `languageCode`
   - `pages` 表：将 `languageId` 转换为 `languageCode`
   - `settings` 表：将 `languageId` 转换为 `languageCode`（如果存在）

5. **迁移脚本逻辑**
   ```sql
   -- 完整迁移流程
   -- 1. 确保 languages 表的 code 字段正确
   -- 2. 为每个唯一的 originalId 或 id 创建 ArticleBase
   -- 3. 将所有 Article 记录转换为 ArticleContent，同时将 languageId 转换为 languageCode
   -- 4. 处理 originalId 关系，确保翻译版本共享同一个 ArticleBase
   -- 5. 迁移其他相关表（categories, tags, pages, settings）
   ```

### 4.2 迁移注意事项

1. **语言代码一致性**：
   - **必须确保** `languages.code` 与 `nuxt.config.ts` 中的语言代码完全一致
   - 迁移前验证所有语言代码是否正确
   - 如果数据库中的语言代码与配置不一致，需要先修正

2. **languageId 到 languageCode 转换**：
   - 迁移时需要 JOIN `languages` 表获取对应的 `code`
   - 确保所有 `languageId` 都能找到对应的 `code`
   - 如果某个 `languageId` 找不到对应的语言，需要处理异常情况

3. **originalId 处理**：
   - 如果文章有 `originalId`，找到原始文章对应的 `articleBaseId`
   - 将当前文章的 `articleBaseId` 设置为相同的值
   - 如果没有 `originalId`，创建新的 `ArticleBase`

4. **数据去重**：
   - 确保相同 `originalId` 的文章共享同一个 `ArticleBase`
   - 如果 `originalId` 为空，则每个文章创建独立的 `ArticleBase`

5. **索引重建**：
   - 迁移完成后重建所有索引
   - 特别关注 `languageCode` 相关的索引
   - 验证唯一性约束（如 `[slug, languageCode]`）

6. **数据验证**：
   - 验证所有 `languageCode` 值都在 `languages.code` 中存在
   - 验证数据完整性
   - 对比迁移前后的数据量

## 五、API 层重构

### 5.1 需要修改的 API 端点

1. **创建文章** (`POST /api/creator/articles`)
   - 先创建 `ArticleBase`
   - 再创建 `ArticleContent`

2. **更新文章** (`PATCH /api/creator/articles/:id`)
   - 区分更新基础信息还是内容
   - 基础信息更新影响所有语言版本
   - 内容更新只影响当前语言版本

3. **获取文章列表** (`GET /api/creator/articles`)
   - JOIN `ArticleBase` 和 `ArticleContent`
   - 返回合并后的数据

4. **获取单篇文章** (`GET /api/articles/:slug`)
   - 根据 `slug` 和 `languageCode` 查找 `ArticleContent`（直接使用语言代码，无需查询 Language 表）
   - JOIN `ArticleBase` 获取基础信息

5. **翻译文章** (`POST /api/creator/articles/:id/translate`)
   - 找到原文章的 `articleBaseId`
   - 创建新的 `ArticleContent`，使用相同的 `articleBaseId` 和目标 `languageCode`（直接使用语言代码）

### 5.2 查询示例（使用 languageCode）

**优化前（使用 languageId，需要先查询 Language 表）**：
```typescript
// 需要先查询语言ID
const lang = await prisma.language.findUnique({
  where: { code: "zh" }
});
const langId = lang.id;

// 然后才能查询文章
const articles = await prisma.articleContent.findMany({
  where: {
    languageId: langId,  // 需要额外的查询
    articleBase: { isPublished: true }
  },
  include: { articleBase: true }
});
```

**优化后（直接使用 languageCode）**：
```typescript
// 直接使用语言代码，无需额外查询
const articles = await prisma.articleContent.findMany({
  where: {
    languageCode: "zh",  // 直接使用代码，与 nuxt.config.ts 一致
    articleBase: { isPublished: true }
  },
  include: { articleBase: true }
});
```

**获取单篇文章**：
```typescript
// 直接使用语言代码和 slug
const article = await prisma.articleContent.findUnique({
  where: {
    slug_languageCode: {  // 使用 languageCode 替代 languageId
      slug: slug,
      languageCode: "zh"  // 直接使用代码
    }
  },
  include: { articleBase: true }
});
```

**优势**：
- ✅ 无需先查询 Language 表获取 ID
- ✅ 减少数据库查询次数
- ✅ 提高查询效率
- ✅ 代码更简洁，直接使用语言代码
- ✅ 与前端配置（nuxt.config.ts）保持一致

## 六、前端重构

### 6.1 需要修改的页面

1. **文章列表页** (`app/pages/admin/posts.vue`)
   - 适配新的数据结构
   - 显示基础信息和当前语言的内容

2. **文章编辑页** (`app/pages/admin/editpost.vue`)
   - 区分基础信息和内容编辑
   - 基础信息编辑影响所有语言版本（需要提示）

3. **文章展示页** (`app/pages/post/[slug].vue`)
   - 适配新的数据结构
   - 从 `ArticleContent` 和 `ArticleBase` 合并数据

### 6.2 数据模型调整

更新 `utils/models.ts` 中的 `Article` 接口：

```typescript
export interface ArticleBase {
  id: string;
  featuredImage: string | null;
  status: string;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  authorId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleContent {
  id: string;
  articleBaseId: string;
  languageId: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeyword: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Article extends ArticleContent {
  articleBase: ArticleBase;
}
```

## 七、其他相关表调整

### 7.1 Category 表

`Category` 表需要调整，使用 `languageCode` 替代 `languageId`：

```prisma
model Category {
  id          String   @id @default(cuid()) @db.VarChar(36)
  slug        String   @db.VarChar(100)
  name        String   @db.VarChar(100)
  description String?  @db.Text
  color       String?  @db.VarChar(20)
  icon        String?  @db.VarChar(100)
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 使用 languageCode 替代 languageId
  languageCode String  @db.VarChar(10)  // 语言代码（如 "zh", "en", "ja"）
  parentId     String? @db.VarChar(36)

  @@unique([slug, languageCode])  // 改为使用 languageCode
  @@index([languageCode, isActive])
  @@index([parentId])
  @@map("categories")
}
```

### 7.2 Tag 表

`Tag` 表需要调整，使用 `languageCode` 替代 `languageId`：

```prisma
model Tag {
  id        String   @id @default(cuid()) @db.VarChar(36)
  slug      String   @db.VarChar(100)
  name      String   @db.VarChar(100)
  color     String?  @db.VarChar(20)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 使用 languageCode 替代 languageId
  languageCode String @db.VarChar(10)  // 语言代码（如 "zh", "en", "ja"）

  @@unique([slug, languageCode])  // 改为使用 languageCode
  @@index([languageCode])
  @@map("tags")
}
```

### 7.3 ArticleTag 表

`ArticleTag` 表需要调整，关联到 `ArticleBase` 而不是 `ArticleContent`：

```prisma
model ArticleTag {
  id            String @id @default(cuid()) @db.VarChar(36)
  articleBaseId String @db.VarChar(36)  // 改为关联 ArticleBase
  tagId         String @db.VarChar(36)

  @@unique([articleBaseId, tagId])
  @@index([articleBaseId])
  @@index([tagId])
  @@map("article_tags")
}
```

### 7.4 Comment 表

`Comment` 表需要调整，关联到 `ArticleBase`：

```prisma
model Comment {
  id          String   @id @default(cuid()) @db.VarChar(36)
  content     String   @db.Text
  authorName  String   @db.VarChar(100)
  authorEmail String   @db.VarChar(255)
  authorUrl   String?  @db.VarChar(500)
  isApproved  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 改为关联 ArticleBase
  articleBaseId String  @db.VarChar(36)
  userId        String? @db.VarChar(36)
  parentId      String? @db.VarChar(36)

  @@index([articleBaseId])
  @@index([userId])
  @@index([parentId])
  @@map("comments")
}
```

### 7.5 ArticleLike 表

`ArticleLike` 表需要调整，关联到 `ArticleBase`：

```prisma
model ArticleLike {
  id            String   @id @default(cuid()) @db.VarChar(36)
  articleBaseId String   @db.VarChar(36)  // 改为关联 ArticleBase
  userId        String?  @db.VarChar(36)
  ipAddress     String?  @db.VarChar(45)
  createdAt     DateTime @default(now())

  @@unique([articleBaseId, userId])
  @@unique([articleBaseId, ipAddress])
  @@index([articleBaseId])
  @@map("article_likes")
}
```

### 7.6 Page 表

`Page` 表需要调整，使用 `languageCode` 替代 `languageId`：

```prisma
model Page {
  id             String   @id @default(cuid()) @db.VarChar(36)
  slug           String   @db.VarChar(100)
  title          String   @db.VarChar(200)
  content        String   @db.Text
  excerpt        String?  @db.Text
  seoTitle       String?  @db.VarChar(200)
  seoDescription String?  @db.VarChar(500)
  isPublished    Boolean  @default(false)
  sortOrder      Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // 使用 languageCode 替代 languageId
  languageCode String @db.VarChar(10)  // 语言代码（如 "zh", "en", "ja"）

  @@unique([slug, languageCode])  // 改为使用 languageCode
  @@index([languageCode, isPublished])
  @@map("pages")
}
```

### 7.7 Setting 表

`Setting` 表需要调整，使用 `languageCode` 替代 `languageId`：

```prisma
model Setting {
  id          String   @id @default(cuid()) @db.VarChar(36)
  title       String   @db.VarChar(200)
  description String   @db.VarChar(500)
  keyword     String   @db.VarChar(500)
  logo        String   @db.VarChar(500)
  logoLight   String?  @db.VarChar(500)
  logoDark    String?  @db.VarChar(500)
  icon        String   @db.VarChar(500)
  iconLight   String?  @db.VarChar(500)
  iconDark    String?  @db.VarChar(500)
  defaultLang String   @db.VarChar(10)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 使用 languageCode 替代 languageId
  languageCode String? @db.VarChar(10)  // 语言代码（如 "zh", "en", "ja"）

  // 多语言功能配置
  i18nEnabled     Boolean @default(false)
  primaryLanguage String? @db.VarChar(10)
  targetLanguages String? @db.Text

  // HTML/CSS/JS 注入
  customHead String? @db.Text
  customCSS  String? @db.Text
  customJS   String? @db.Text

  @@index([languageCode])
  @@map("settings")
}
```

## 八、实施计划

### 阶段一：数据库迁移（预计 2-3 天）

1. 创建新的 Prisma schema
2. 生成迁移文件
3. 编写数据迁移脚本
4. 在测试环境验证迁移
5. 备份生产数据
6. 执行生产迁移

### 阶段二：API 层重构（预计 3-4 天）

1. 重构文章创建 API
2. 重构文章更新 API
3. 重构文章查询 API
4. 重构翻译 API
5. 更新所有相关的 API 端点
6. 编写/更新 API 测试

### 阶段三：前端重构（预计 2-3 天）

1. 更新数据模型接口
2. 重构文章列表页
3. 重构文章编辑页
4. 重构文章展示页
5. 更新所有使用文章数据的组件
6. 前端测试

### 阶段四：测试与优化（预计 2-3 天）

1. 端到端测试
2. 性能测试
3. 数据一致性验证
4. 修复发现的问题
5. 文档更新

## 九、风险评估

### 9.1 技术风险

1. **数据迁移风险**：
   - 风险：数据丢失或损坏
   - 缓解：充分备份、在测试环境验证、分阶段迁移

2. **性能风险**：
   - 风险：JOIN 查询可能影响性能
   - 缓解：合理设计索引、优化查询、必要时使用缓存

3. **兼容性风险**：
   - 风险：现有功能可能受影响
   - 缓解：充分测试、逐步发布、保留回滚方案

### 9.2 业务风险

1. **用户体验**：
   - 风险：重构期间可能影响用户体验
   - 缓解：在低峰期执行、提前通知、快速回滚

2. **数据一致性**：
   - 风险：迁移过程中可能出现数据不一致
   - 缓解：事务处理、数据验证、一致性检查

## 十、回滚方案

如果重构出现问题，可以：

1. **数据库回滚**：
   - 恢复备份的 `articles` 表
   - 删除新创建的表

2. **代码回滚**：
   - 回退到重构前的代码版本
   - 恢复旧的 API 实现

3. **分阶段回滚**：
   - 如果只是部分功能有问题，可以只回滚相关部分
   - 保留已迁移的数据，后续再处理

## 十一、后续优化建议

1. **缓存策略**：
   - 对频繁查询的文章基础信息进行缓存
   - 使用 Redis 缓存热门文章

2. **搜索优化**：
   - 考虑使用全文搜索引擎（如 Elasticsearch）
   - 优化多语言搜索体验

3. **统计优化**：
   - 考虑将 `viewCount` 等统计数据单独存储
   - 使用更高效的统计方案

4. **分类多语言支持**：
   - 如果分类也需要多语言，可以考虑类似的拆分方案

## 十二、语言代码优化总结

### 12.1 优化效果对比

| 方面           | 优化前（使用 languageId）                             | 优化后（使用 languageCode） |
| -------------- | ----------------------------------------------------- | --------------------------- |
| **查询步骤**   | 1. 查询 Language 表获取 ID<br>2. 使用 ID 查询业务数据 | 直接使用语言代码查询        |
| **查询次数**   | 2 次数据库查询                                        | 1 次数据库查询              |
| **JOIN 操作**  | 需要 JOIN Language 表                                 | 无需 JOIN                   |
| **前端匹配**   | 需要先获取 languageId                                 | 直接使用配置的语言代码      |
| **代码复杂度** | 较高（需要额外查询）                                  | 较低（直接使用）            |
| **性能**       | 较慢（多一次查询）                                    | 更快（减少查询）            |

### 12.2 核心优势

1. ✅ **性能提升**：减少数据库查询次数，提高查询效率
2. ✅ **代码简化**：前端直接使用语言代码，无需额外查询
3. ✅ **配置一致**：与 `nuxt.config.ts` 中的语言配置保持一致
4. ✅ **维护方便**：语言代码是业务语义，比 UUID 更易理解
5. ✅ **扩展性好**：添加新语言只需在配置和数据库中添加代码

### 12.3 实施要点

1. **确保一致性**：`languages.code` 必须与 `nuxt.config.ts` 完全一致
2. **数据迁移**：迁移时需要将 `languageId` 转换为 `languageCode`
3. **索引优化**：为 `languageCode` 字段添加索引
4. **API 调整**：所有 API 端点改为使用 `languageCode`
5. **前端适配**：前端直接使用语言代码，无需查询 Language 表

## 十三、总结

本次重构包含两个核心优化：

### 13.1 表结构拆分
将文章表拆分为基础信息表和内容表，能够：

1. ✅ **解决基础信息重复问题**：封面图、状态、浏览次数等只需存储一次
2. ✅ **提高数据一致性**：所有语言版本共享基础信息，避免不一致
3. ✅ **降低维护成本**：更新基础信息只需更新一次
4. ✅ **更好的扩展性**：未来可以轻松添加新的语言版本

### 13.2 语言关联优化
将 `languageId` 改为 `languageCode`，能够：

1. ✅ **提升查询性能**：减少数据库查询次数，无需 JOIN Language 表
2. ✅ **简化前端逻辑**：直接使用语言代码，与配置保持一致
3. ✅ **降低系统复杂度**：减少中间查询步骤，代码更简洁

### 13.3 实施建议

重构需要谨慎执行，建议：
- ✅ 充分测试（特别是数据迁移脚本）
- ✅ 分阶段实施（先测试环境，再生产环境）
- ✅ 保留回滚方案（备份数据，保留旧代码）
- ✅ 做好数据备份（迁移前完整备份）
- ✅ 验证语言代码一致性（确保配置与数据库一致）

