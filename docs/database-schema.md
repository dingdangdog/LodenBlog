# 数据库表结构设计

## 1. 用户表 (users)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| email | VARCHAR | 255 | NOT NULL | - | 邮箱，唯一 |
| username | VARCHAR | 50 | NOT NULL | - | 用户名，唯一 |
| password | VARCHAR | 255 | NULL | - | 密码，第三方登录用户可为空 |
| avatar | VARCHAR | 500 | NULL | - | 头像URL |
| bio | TEXT | - | NULL | - | 个人简介 |
| role | ENUM | - | NOT NULL | 'USER' | 用户角色：ADMIN/EDITOR/USER |
| isActive | BOOLEAN | - | NOT NULL | true | 是否激活 |
| emailVerified | BOOLEAN | - | NOT NULL | false | 邮箱验证状态 |
| googleId | VARCHAR | 100 | NULL | - | Google用户ID |
| githubId | VARCHAR | 100 | NULL | - | GitHub用户ID |
| twitterId | VARCHAR | 100 | NULL | - | X(Twitter)用户ID |
| facebookId | VARCHAR | 100 | NULL | - | Facebook用户ID |
| createdAt | DATETIME | - | NOT NULL | NOW() | 创建时间 |
| updatedAt | DATETIME | - | NOT NULL | NOW() | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY (email)
- UNIQUE KEY (username)
- INDEX (googleId)
- INDEX (githubId)
- INDEX (twitterId)
- INDEX (facebookId)

## 2. 语言表 (languages)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| code | VARCHAR | 10 | NOT NULL | - | 语言代码，如'zh', 'en-US' |
| name | VARCHAR | 50 | NOT NULL | - | 语言名称 |
| nativeName | VARCHAR | 50 | NOT NULL | - | 本地语言名称 |
| flag | VARCHAR | 500 | NULL | - | 国旗图标URL |
| isActive | BOOLEAN | - | NOT NULL | true | 是否激活 |
| isDefault | BOOLEAN | - | NOT NULL | false | 是否默认语言 |
| sortOrder | INT | - | NOT NULL | 0 | 排序 |
| createdAt | DATETIME | - | NOT NULL | NOW() | 创建时间 |
| updatedAt | DATETIME | - | NOT NULL | NOW() | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY (code)

## 3. 文章表 (articles)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| slug | VARCHAR | 200 | NOT NULL | - | URL友好标识符 |
| title | VARCHAR | 200 | NOT NULL | - | 文章标题 |
| content | LONGTEXT | - | NOT NULL | - | 文章内容 |
| excerpt | TEXT | - | NULL | - | 文章摘要 |
| featuredImage | VARCHAR | 500 | NULL | - | 特色图片URL |
| status | ENUM | - | NOT NULL | 'DRAFT' | 状态：DRAFT/PUBLISHED/ARCHIVED |
| isPublished | BOOLEAN | - | NOT NULL | false | 是否发布 |
| publishedAt | DATETIME | - | NULL | - | 发布时间 |
| viewCount | INT | - | NOT NULL | 0 | 浏览次数 |
| seoTitle | VARCHAR | 200 | NULL | - | SEO标题 |
| seoDescription | VARCHAR | 500 | NULL | - | SEO描述 |
| seoKeyword | VARCHAR | 500 | NULL | - | SEO关键词 |
| authorId | VARCHAR | 36 | NOT NULL | - | 作者ID |
| languageId | VARCHAR | 36 | NOT NULL | - | 语言ID |
| categoryId | VARCHAR | 36 | NULL | - | 分类ID |
| originalId | VARCHAR | 36 | NULL | - | 原文ID，用于翻译关联 |
| createdAt | DATETIME | - | NOT NULL | NOW() | 创建时间 |
| updatedAt | DATETIME | - | NOT NULL | NOW() | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY (slug, languageId)
- INDEX (languageId, status, publishedAt)
- INDEX (categoryId, publishedAt)
- INDEX (isPublished, publishedAt)
- INDEX (originalId)
- FOREIGN KEY (authorId) REFERENCES users(id)
- FOREIGN KEY (languageId) REFERENCES languages(id)
- FOREIGN KEY (categoryId) REFERENCES categories(id)
- FOREIGN KEY (originalId) REFERENCES articles(id)

## 4. 分类表 (categories)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| slug | VARCHAR | 100 | NOT NULL | - | 分类标识符 |
| name | VARCHAR | 100 | NOT NULL | - | 分类名称 |
| description | TEXT | - | NULL | - | 分类描述 |
| color | VARCHAR | 20 | NULL | - | 分类颜色 |
| icon | VARCHAR | 100 | NULL | - | 分类图标 |
| sortOrder | INT | - | NOT NULL | 0 | 排序 |
| isActive | BOOLEAN | - | NOT NULL | true | 是否激活 |
| languageId | VARCHAR | 36 | NOT NULL | - | 语言ID |
| parentId | VARCHAR | 36 | NULL | - | 父分类ID |
| createdAt | DATETIME | - | NOT NULL | NOW() | 创建时间 |
| updatedAt | DATETIME | - | NOT NULL | NOW() | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY (slug, languageId)
- INDEX (languageId, isActive)
- INDEX (parentId)
- FOREIGN KEY (languageId) REFERENCES languages(id)
- FOREIGN KEY (parentId) REFERENCES categories(id)

## 5. 标签表 (tags)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| slug | VARCHAR | 100 | NOT NULL | - | 标签标识符 |
| name | VARCHAR | 100 | NOT NULL | - | 标签名称 |
| color | VARCHAR | 20 | NULL | - | 标签颜色 |
| languageId | VARCHAR | 36 | NOT NULL | - | 语言ID |
| createdAt | DATETIME | - | NOT NULL | NOW() | 创建时间 |
| updatedAt | DATETIME | - | NOT NULL | NOW() | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY (slug, languageId)
- INDEX (languageId)
- FOREIGN KEY (languageId) REFERENCES languages(id)

## 6. 文章标签关联表 (article_tags)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| articleId | VARCHAR | 36 | NOT NULL | - | 文章ID |
| tagId | VARCHAR | 36 | NOT NULL | - | 标签ID |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY (articleId, tagId)
- FOREIGN KEY (articleId) REFERENCES articles(id) ON DELETE CASCADE
- FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE

## 7. 评论表 (comments)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| content | TEXT | - | NOT NULL | - | 评论内容 |
| authorName | VARCHAR | 100 | NOT NULL | - | 作者姓名 |
| authorEmail | VARCHAR | 255 | NOT NULL | - | 作者邮箱 |
| authorUrl | VARCHAR | 500 | NULL | - | 作者网站 |
| isApproved | BOOLEAN | - | NOT NULL | false | 是否审核通过 |
| articleId | VARCHAR | 36 | NOT NULL | - | 文章ID |
| userId | VARCHAR | 36 | NULL | - | 用户ID |
| parentId | VARCHAR | 36 | NULL | - | 父评论ID |
| createdAt | DATETIME | - | NOT NULL | NOW() | 创建时间 |
| updatedAt | DATETIME | - | NOT NULL | NOW() | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX (articleId)
- INDEX (userId)
- INDEX (parentId)
- FOREIGN KEY (articleId) REFERENCES articles(id) ON DELETE CASCADE
- FOREIGN KEY (userId) REFERENCES users(id)
- FOREIGN KEY (parentId) REFERENCES comments(id)

## 8. 媒体文件表 (media)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| filename | VARCHAR | 255 | NOT NULL | - | 文件名 |
| originalName | VARCHAR | 255 | NOT NULL | - | 原始文件名 |
| mimeType | VARCHAR | 100 | NOT NULL | - | MIME类型 |
| size | INT | - | NOT NULL | - | 文件大小(字节) |
| path | VARCHAR | 500 | NOT NULL | - | 文件路径 |
| url | VARCHAR | 500 | NOT NULL | - | 访问URL |
| alt | VARCHAR | 255 | NULL | - | 图片alt文本 |
| caption | VARCHAR | 500 | NULL | - | 图片说明 |
| metadata | TEXT | - | NULL | - | 元数据(JSON字符串) |
| uploaderId | VARCHAR | 36 | NOT NULL | - | 上传者ID |
| createdAt | DATETIME | - | NOT NULL | NOW() | 创建时间 |
| updatedAt | DATETIME | - | NOT NULL | NOW() | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX (uploaderId)
- FOREIGN KEY (uploaderId) REFERENCES users(id)

## 9. 系统设置表 (settings)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| title | VARCHAR | 200 | NOT NULL | - | 网站标题 |
| description | VARCHAR | 500 | NOT NULL | - | 网站描述 |
| keyword | VARCHAR | 500 | NOT NULL | - | 网站关键词 |
| logo | VARCHAR | 500 | NOT NULL | - | 网站Logo |
| icon | VARCHAR | 500 | NOT NULL | - | 网站图标 |
| defaultLang | VARCHAR | 10 | NOT NULL | 'zh_CN' | 默认语言 |
| languageId | VARCHAR | 36 | NULL | - | 语言ID |
| createdAt | DATETIME | - | NOT NULL | NOW() | 创建时间 |
| updatedAt | DATETIME | - | NOT NULL | NOW() | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- FOREIGN KEY (languageId) REFERENCES languages(id)

## 10. 页面表 (pages)

| 字段名 | 数据类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|----------|------|----------|--------|------|
| id | VARCHAR | 36 | NOT NULL | CUID() | 主键 |
| slug | VARCHAR | 100 | NOT NULL | - | 页面标识符 |
| title | VARCHAR | 200 | NOT NULL | - | 页面标题 |
| content | LONGTEXT | - | NOT NULL | - | 页面内容 |
| excerpt | TEXT | - | NULL | - | 页面摘要 |
| seoTitle | VARCHAR | 200 | NULL | - | SEO标题 |
| seoDescription | VARCHAR | 500 | NULL | - | SEO描述 |
| isPublished | BOOLEAN | - | NOT NULL | false | 是否发布 |
| sortOrder | INT | - | NOT NULL | 0 | 排序 |
| languageId | VARCHAR | 36 | NOT NULL | - | 语言ID |
| createdAt | DATETIME | - | NOT NULL | NOW() | 创建时间 |
| updatedAt | DATETIME | - | NOT NULL | NOW() | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY (slug, languageId)
- INDEX (languageId, isPublished)
- FOREIGN KEY (languageId) REFERENCES languages(id)

## 11. URL路径映射

| 页面类型 | URL格式 | 说明 |
|----------|---------|------|
| 文章 | /{languageCode}/post/{slug} | 如：/zh/post/my-article |
| 页面 | /{languageCode}/{pageSlug} | 如：/zh/about |
| 分类 | /{languageCode}/category/{categorySlug} | 如：/zh/category/tech |
| 标签 | /{languageCode}/tag/{tagSlug} | 如：/zh/tag/vue |

## 12. 第三方登录查询示例

```sql
-- 通过Google ID查找用户
SELECT * FROM users WHERE googleId = 'google_user_id';

-- 通过GitHub ID查找用户
SELECT * FROM users WHERE githubId = 'github_user_id';

-- 通过Twitter ID查找用户
SELECT * FROM users WHERE twitterId = 'twitter_user_id';

-- 检查邮箱是否已存在（用于第三方登录时自动关联）
SELECT * FROM users WHERE email = 'user@example.com';
```

## 13. 多语言文章查询示例

```sql
-- 获取指定语言的文章
SELECT a.*, l.code as language_code, l.name as language_name
FROM articles a
JOIN languages l ON a.languageId = l.id
WHERE a.slug = 'my-name' AND l.code = 'zh';

-- 获取文章的所有翻译版本
SELECT a.*, l.code as language_code, l.name as language_name
FROM articles a
JOIN languages l ON a.languageId = l.id
WHERE a.originalId = (SELECT id FROM articles WHERE slug = 'my-name' AND languageId = 'lang_zh')
   OR a.id = (SELECT id FROM articles WHERE slug = 'my-name' AND languageId = 'lang_zh');
```
