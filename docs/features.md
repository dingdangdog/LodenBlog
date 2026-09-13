# 功能说明文档

## 1. 权限系统

### 1.1 角色定义

系统支持三种用户角色：

#### USER（普通用户）
- 注册和登录
- 浏览文章
- 发表评论
- 编辑个人资料

#### CREATOR（创作者）
- 继承普通用户的所有权限
- 创建文章
- 编辑自己的文章
- 删除自己的文章
- 翻译自己的文章

#### ADMIN（管理员）
- 继承创作者的所有权限
- 管理所有文章（包括其他用户的文章）
- 管理用户
- 管理系统设置
- 管理语言配置
- 初始化种子数据

### 1.2 前端权限使用

#### 在组件中检查权限

```vue
<template>
  <div>
    <!-- 仅登录用户可见 -->
    <div v-if="isAuthenticated">
      欢迎, {{ user.username }}
    </div>

    <!-- 仅创作者可见 -->
    <button v-if="isCreator" @click="createArticle">
      创建文章
    </button>

    <!-- 仅管理员可见 -->
    <NuxtLink v-if="isAdmin" to="/admin">
      管理后台
    </NuxtLink>

    <!-- 检查是否可以编辑（所有者或管理员） -->
    <button v-if="canEdit(article.authorId)" @click="editArticle">
      编辑文章
    </button>
  </div>
</template>

<script setup lang="ts">
const { 
  user, 
  isAuthenticated, 
  isCreator, 
  isAdmin, 
  canEdit 
} = usePermission();
</script>
```

#### 在路由中设置权限

使用中间件保护路由：

```typescript
// pages/admin/index.vue
definePageMeta({
  middleware: ['role']  // 使用角色中间件
});
```

### 1.3 后端权限使用

#### 在 API 中检查权限

```typescript
// 需要登录
import { requireAuth } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  // user.id, user.email, user.role 可用
});

// 需要创作者或管理员
import { requireCreator } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  const user = await requireCreator(event);
  // 仅创作者和管理员可以执行到这里
});

// 需要管理员
import { requireAdmin } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event);
  // 仅管理员可以执行到这里
});

// 检查资源所有者或管理员
import { requireOwnerOrAdmin } from "~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  const article = await getArticle();
  const user = await requireOwnerOrAdmin(event, article.authorId);
  // 仅文章作者或管理员可以执行到这里
});
```

## 2. 系统初始化

### 2.1 初始化流程

1. 首次访问系统时，会自动检测初始化状态
2. 如果未初始化，自动跳转到 `/setup` 页面
3. 填写网站信息和管理员账号
4. 点击"开始初始化"完成设置
5. 系统自动创建：
   - 管理员账号
   - 默认语言（中文、英文、日文）
   - 默认分类（未分类）
   - 系统设置

### 2.2 初始化后操作

#### 登录管理员账号
使用初始化时设置的邮箱和密码登录。

#### 初始化示例数据（可选）
```bash
POST /api/system/seed
Authorization: Bearer <admin_token>

{
  "type": "all"  // 或 "categories" 或 "tags"
}
```

这会创建：
- 示例分类：技术、生活
- 示例标签：教程、指南、新闻

## 3. OAuth 登录

### 3.1 支持的 OAuth 提供商

- GitHub
- Google

### 3.2 配置 OAuth

#### GitHub OAuth

1. 访问 https://github.com/settings/developers
2. 创建 New OAuth App
3. 设置：
   - Application name: 你的应用名称
   - Homepage URL: http://localhost:7061（或你的域名）
   - Authorization callback URL: http://localhost:7061/api/auth/callback/github
4. 获取 Client ID 和 Client Secret
5. 在 `env` 文件中配置：
   ```
   GITHUB_CLIENT_ID=你的客户端ID
   GITHUB_CLIENT_SECRET=你的客户端密钥
   ```

#### Google OAuth

1. 访问 https://console.cloud.google.com/
2. 创建项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 设置：
   - 应用类型：Web 应用
   - 已授权的重定向 URI: http://localhost:7061/api/auth/callback/google
6. 获取客户端 ID 和客户端密钥
7. 在 `env` 文件中配置：
   ```
   GOOGLE_CLIENT_ID=你的客户端ID
   GOOGLE_CLIENT_SECRET=你的客户端密钥
   ```

### 3.3 OAuth 登录流程

1. 用户点击"使用 GitHub 登录"或"使用 Google 登录"
2. 跳转到 OAuth 提供商授权页面
3. 用户授权后返回系统
4. 系统自动：
   - 查找是否已有该 OAuth ID 的用户
   - 如果没有，创建新用户（角色为 USER）
   - 登录该用户
5. 跳转到首页

### 3.4 OAuth 用户管理

#### 首次 OAuth 登录
- 自动创建新用户
- 角色默认为 USER
- 邮箱来自 OAuth 提供商
- 用户名自动生成

#### 升级为创作者
管理员可在数据库中修改用户角色：
```sql
UPDATE users SET role = 'CREATOR' WHERE email = 'user@example.com';
```

## 4. 多语言本地化

### 4.1 添加新的翻译

编辑语言文件：
- `locales/zh/base.json` - 中文
- `locales/en/base.json` - 英文
- `locales/ja/base.json` - 日文

示例：
```json
{
  "common": {
    "yourKey": "Your Translation"
  }
}
```

### 4.2 在组件中使用翻译

```vue
<template>
  <div>
    {{ $t('common.yourKey') }}
  </div>
</template>
```

### 4.3 管理语言

#### 创建新语言（管理员）
```bash
POST /api/admin/languages

{
  "code": "fr",
  "name": "French",
  "nativeName": "Français",
  "isActive": true,
  "isDefault": false
}
```

#### 更新语言（管理员）
```bash
PATCH /api/languages/{id}

{
  "isActive": true,
  "sortOrder": 1
}
```

#### 删除语言（管理员）
```bash
DELETE /api/languages/{id}
```

注意：
- 不能删除默认语言
- 删除前需确保该语言下没有文章
- 删除语言会同时删除该语言的分类和标签

## 5. 文章管理

### 5.1 创建文章（创作者）

```bash
POST /api/creator/articles

{
  "slug": "my-first-article",
  "title": "我的第一篇文章",
  "content": "文章内容...",
  "excerpt": "摘要",
  "languageId": "language_id",
  "categoryId": "category_id",
  "status": "DRAFT",
  "isPublished": false
}
```

### 5.2 更新文章（创作者/管理员）

```bash
PATCH /api/creator/articles/{id}

{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "isPublished": true
}
```

### 5.3 翻译文章（创作者）

```bash
POST /api/creator/articles/{id}/translate

{
  "targetLanguageId": "target_language_id",
  "autoTranslate": false
}
```

这会创建一个新的文章副本，关联到原文章。

### 5.4 删除文章（创作者/管理员）

```bash
DELETE /api/creator/articles/{id}
```

注意：
- 创作者只能删除自己的文章
- 管理员可以删除任何文章
- 删除文章会同时删除相关的标签关联

## 6. 系统设置

### 6.1 更新系统设置（管理员）

```bash
PUT /api/admin/settings

{
  "title": "新的网站标题",
  "description": "新的网站描述",
  "keyword": "关键词1,关键词2",
  "defaultLang": "zh",
  "i18nEnabled": true,
  "customCSS": ".my-custom-class { color: red; }",
  "customJS": "console.log('Custom JS');"
}
```

### 6.2 可配置项

- `title` - 网站标题
- `description` - 网站描述
- `keyword` - SEO 关键词
- `logo` - Logo 图片 URL
- `icon` - 网站图标 URL
- `defaultLang` - 默认语言代码
- `i18nEnabled` - 是否启用多语言
- `customHead` - 自定义 HTML Head 内容
- `customCSS` - 自定义 CSS
- `customJS` - 自定义 JavaScript

## 7. API 列表

### 公开 API
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/[slug]` - 获取文章详情
- `GET /api/languages` - 获取语言列表
- `GET /api/tags` - 获取标签列表
- `GET /api/settings` - 获取系统设置
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `POST /api/system/init` - 系统初始化
- `GET /api/system/init-status` - 检查初始化状态

### 需要登录
- `GET /api/entry/me` - 获取当前用户信息
- `PATCH /api/entry/me` - 更新当前用户信息
- `GET /api/entry/me/visibility` - 获取用户权限信息
- `GET /api/auth/session` - 获取会话信息
- `POST /api/auth/logout` - 登出

### 创作者 API
- `POST /api/creator/articles` - 创建文章
- `PATCH /api/creator/articles/[id]` - 更新文章
- `DELETE /api/creator/articles/[id]` - 删除文章
- `POST /api/creator/articles/[id]/translate` - 翻译文章

### 管理员 API
- `PUT /api/admin/settings` - 更新系统设置
- `POST /api/admin/languages` - 创建语言
- `PATCH /api/languages/[id]` - 更新语言
- `DELETE /api/languages/[id]` - 删除语言
- `POST /api/system/seed` - 初始化种子数据

## 8. 最佳实践

### 8.1 安全性
- 使用强密码作为 `NUXT_AUTH_SECRET`
- 生产环境启用 HTTPS
- 定期更新依赖包
- 限制数据库访问
- 定期备份数据

### 8.2 性能优化
- 使用 CDN 存储静态资源
- 配置缓存策略
- 优化数据库查询
- 使用分页加载数据

### 8.3 内容管理
- 定期审核用户内容
- 设置适当的分类和标签
- 使用 SEO 优化字段
- 保持内容多语言同步

### 8.4 用户管理
- 谨慎分配创作者和管理员权限
- 监控用户活动
- 及时处理滥用行为
- 定期清理不活跃账号

