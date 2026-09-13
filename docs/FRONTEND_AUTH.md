# 前端权限控制使用指南

## 核心概念

Nuxt 的前端权限控制使用 `definePageMeta` 在页面中声明权限要求，中间件读取 meta 信息进行判断。

**不要在中间件中硬编码路径！**

## 正确用法

### 1. 在页面中声明权限要求

使用 `definePageMeta` 定义页面的权限要求：

```vue
<script setup lang="ts">
definePageMeta({
  requiresAuth: true,      // 是否需要登录
  roles: ['ADMIN'],        // 需要的角色（可选）
  middleware: ['role'],    // 如果定义了 roles，需要添加 role 中间件
});
</script>
```

### 2. 中间件自动读取 meta

中间件会自动读取页面的 `meta` 信息进行权限检查，无需手动配置路径。

## 使用示例

### 公开页面（无需登录）

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
definePageMeta({
  requiresAuth: false,  // 明确标记为公开页面
});
</script>
```

**示例页面：**
- 首页 `/`
- 登录页 `/login`
- 注册页 `/register`
- 文章详情页 `/post/[slug]`

### 需要登录的页面

```vue
<!-- pages/profile.vue -->
<script setup lang="ts">
definePageMeta({
  requiresAuth: true,  // 需要登录
});
</script>
```

### 需要创作者权限的页面

```vue
<!-- pages/creator/articles.vue -->
<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  roles: ['CREATOR', 'ADMIN'],  // 创作者或管理员
  middleware: ['role'],         // 使用角色中间件
});
</script>
```

### 仅管理员可访问的页面

```vue
<!-- pages/admin/index.vue -->
<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  roles: ['ADMIN'],      // 仅管理员
  middleware: ['role'],  // 使用角色中间件
});
</script>
```

## 中间件说明

### auth.global.ts - 全局认证中间件

- 自动在所有路由上执行
- 读取 `to.meta.requiresAuth`
- 如果为 `true` 但未登录，跳转到登录页
- 如果为 `false` 或 `undefined`，直接放行

### role.ts - 角色权限中间件

- 仅在页面使用 `middleware: ['role']` 时执行
- 读取 `to.meta.roles`
- 检查用户角色是否在允许列表中
- 权限不足时跳转到首页

## 完整示例

### 示例 1: 管理员后台

```vue
<!-- pages/admin/settings.vue -->
<template>
  <div>
    <h1>系统设置</h1>
    <!-- 仅管理员可见 -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  roles: ['ADMIN'],
  middleware: ['role'],
});
</script>
```

### 示例 2: 创作者文章管理

```vue
<!-- pages/creator/my-articles.vue -->
<template>
  <div>
    <h1>我的文章</h1>
    <!-- 创作者和管理员可见 -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  roles: ['CREATOR', 'ADMIN'],
  middleware: ['role'],
});
</script>
```

### 示例 3: 用户个人中心

```vue
<!-- pages/profile.vue -->
<template>
  <div>
    <h1>个人中心</h1>
    <!-- 所有登录用户可见 -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  // 不设置 roles，所有登录用户都可访问
});
</script>
```

### 示例 4: 公开文章页面

```vue
<!-- pages/[lang]/post/[slug].vue -->
<template>
  <div>
    <h1>{{ article.title }}</h1>
    <!-- 所有人可见 -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiresAuth: false,  // 明确标记为公开
});
</script>
```

## 组件内权限控制

除了页面级别的权限，还可以在组件内使用 `usePermission` 进行细粒度控制：

```vue
<template>
  <div>
    <!-- 所有人可见 -->
    <div class="article-content">{{ content }}</div>

    <!-- 仅登录用户可见 -->
    <button v-if="isAuthenticated" @click="likeArticle">
      点赞
    </button>

    <!-- 仅创作者可见 -->
    <button v-if="isCreator" @click="createArticle">
      创建文章
    </button>

    <!-- 仅管理员可见 -->
    <NuxtLink v-if="isAdmin" to="/admin">
      管理后台
    </NuxtLink>

    <!-- 仅作者或管理员可见 -->
    <button v-if="canEdit(article.authorId)" @click="editArticle">
      编辑
    </button>
  </div>
</template>

<script setup lang="ts">
const { 
  isAuthenticated, 
  isCreator, 
  isAdmin, 
  canEdit 
} = usePermission();
</script>
```

## 常见错误

### ❌ 错误：在中间件中硬编码路径

```typescript
// middleware/role.ts - 错误示例！
export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/admin')) {  // ❌ 不要这样做！
    // ...
  }
});
```

### ✅ 正确：读取页面 meta

```typescript
// middleware/role.ts - 正确示例
export default defineNuxtRouteMiddleware((to) => {
  const requiredRoles = to.meta.roles;  // ✅ 从 meta 读取
  // ...
});
```

### ❌ 错误：忘记添加 role 中间件

```vue
<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  roles: ['ADMIN'],
  // ❌ 忘记添加 middleware: ['role']
});
</script>
```

### ✅ 正确：完整配置

```vue
<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
  roles: ['ADMIN'],
  middleware: ['role'],  // ✅ 必须添加
});
</script>
```

## 权限级别

### 公开访问（无需登录）
```typescript
definePageMeta({
  requiresAuth: false,
});
```

### 登录用户（任何角色）
```typescript
definePageMeta({
  requiresAuth: true,
});
```

### 普通用户及以上
```typescript
definePageMeta({
  requiresAuth: true,
  roles: ['USER', 'CREATOR', 'ADMIN'],
  middleware: ['role'],
});
```

### 创作者及以上
```typescript
definePageMeta({
  requiresAuth: true,
  roles: ['CREATOR', 'ADMIN'],
  middleware: ['role'],
});
```

### 仅管理员
```typescript
definePageMeta({
  requiresAuth: true,
  roles: ['ADMIN'],
  middleware: ['role'],
});
```

## 重定向逻辑

- **未登录访问需要认证的页面** → 跳转到 `/login`
- **权限不足访问受限页面** → 跳转到 `/`（首页）

## 总结

1. ✅ 在页面中使用 `definePageMeta` 声明权限
2. ✅ 中间件读取 `to.meta` 进行判断
3. ✅ 使用 `usePermission` 进行组件内控制
4. ❌ 不要在中间件中硬编码路径
5. ❌ 不要在全局中间件中写业务逻辑

这就是 Nuxt 的标准做法！

