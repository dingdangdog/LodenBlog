# 系统架构说明

## 权限控制架构

### 后端权限控制（Server Side）

后端权限控制放在 `server/` 目录下：

```
server/
├── middleware/          # 后端中间件（自动执行）
│   ├── auth.ts         # 认证中间件：检查用户登录状态
│   └── permission.ts   # 权限中间件：检查用户角色权限
└── utils/
    └── permission.ts   # 权限工具函数：供 API 使用
```

#### 1. 后端中间件

**`server/middleware/auth.ts`** - 认证中间件
- 自动执行于所有 API 请求
- 检查公开路径（如登录、注册、文章列表等）
- 验证用户登录状态
- 将用户信息注入 `event.context.user`

**`server/middleware/permission.ts`** - 权限中间件
- 基于路径前缀检查权限
- `/api/admin/*` - 需要 ADMIN 角色
- `/api/creator/*` - 需要 CREATOR 或 ADMIN 角色
- `/api/entry/*` - 需要 USER、CREATOR 或 ADMIN 角色

#### 2. 后端工具函数

**`server/utils/permission.ts`** - 权限工具函数
- `getCurrentUser()` - 从 context 获取当前用户
- `requireAuth()` - 要求已登录
- `requireCreator()` - 要求创作者权限
- `requireAdmin()` - 要求管理员权限
- `requireOwnerOrAdmin()` - 要求资源所有者或管理员

**使用示例：**
```typescript
// server/api/creator/articles/index.post.ts
import { requireCreator } from "../~~/server/utils/permission";

export default defineEventHandler(async (event) => {
  const user = requireCreator(event); // 中间件已保证权限
  // ... 业务逻辑
});
```

### 前端权限控制（Client Side）

前端权限控制放在 `app/` 或根目录的 `middleware/` 下：

```
middleware/              # 前端中间件
├── auth.global.ts      # 全局认证中间件：检查登录状态
└── role.ts             # 角色权限中间件：检查页面访问权限

app/
└── composables/
    └── usePermission.ts # 前端权限检查组合函数
```

#### 1. 前端中间件

**`middleware/auth.global.ts`** - 全局认证中间件
- 自动在所有路由上执行
- 读取页面 `meta.requiresAuth`
- 未登录用户访问需要认证的页面时跳转到登录页

**`middleware/role.ts`** - 角色权限中间件
- 仅在页面使用 `middleware: ['role']` 时执行
- 读取页面 `meta.roles`
- 检查用户角色是否满足要求

#### 2. 前端组合函数

**`composables/usePermission.ts`** - 权限检查组合函数
- `isAuthenticated` - 是否已登录
- `isUser` - 是否是普通用户
- `isCreator` - 是否是创作者
- `isAdmin` - 是否是管理员
- `canEdit(ownerId)` - 是否可以编辑资源

**页面权限声明示例：**
```vue
<!-- pages/admin/index.vue -->
<script setup lang="ts">
definePageMeta({
  requiresAuth: true,      // 需要登录
  roles: ['ADMIN'],        // 需要管理员角色
  middleware: ['role'],    // 使用角色中间件
});
</script>
```

**组件内权限控制示例：**
```vue
<template>
  <div>
    <button v-if="isCreator" @click="createArticle">
      创建文章
    </button>
    <button v-if="canEdit(article.authorId)" @click="editArticle">
      编辑
    </button>
  </div>
</template>

<script setup lang="ts">
const { isCreator, canEdit } = usePermission();
</script>
```

## 请求流程

### 后端 API 请求流程

```
客户端请求
    ↓
server/middleware/auth.ts
    ├─ 检查是否公开路径 → 是 → 跳过认证
    └─ 否 → 验证登录状态 → 注入 user 到 context
        ↓
server/middleware/permission.ts
    ├─ 检查路径权限要求
    └─ 验证用户角色
        ↓
API Handler (如 server/api/creator/articles/index.post.ts)
    ├─ 使用 requireCreator() 等工具函数
    └─ 执行业务逻辑
        ↓
返回响应
```

### 前端路由导航流程

```
用户导航到新页面
    ↓
middleware/auth.global.ts
    ├─ 检查是否公开路由 → 是 → 允许访问
    └─ 否 → 检查登录状态 → 未登录 → 跳转登录页
        ↓
middleware/role.ts
    ├─ 检查页面权限要求
    └─ 验证用户角色 → 不足 → 跳转首页
        ↓
渲染页面
    └─ 组件内使用 usePermission() 控制元素显示
```

## 关键设计原则

### 1. 前后端分离
- **后端**：`server/middleware/` 和 `server/utils/permission.ts`
- **前端**：`middleware/` 和 `composables/usePermission.ts`
- 各自独立，职责清晰

### 2. 中间件优先
- 后端使用中间件统一处理认证和权限
- API Handler 只需使用简单的工具函数
- 减少重复代码

### 3. 职责单一
- `auth.ts` 只负责认证
- `permission.ts` 只负责权限检查
- 工具函数提供便捷的检查方法

### 4. 安全第一
- 后端中间件自动执行，无法绕过
- 前端权限仅用于 UI 控制
- 真正的权限验证在后端完成

## 目录结构

```
lodenblog/
├── server/                    # 后端代码
│   ├── middleware/           # 后端中间件（自动执行）
│   │   ├── auth.ts          # 认证中间件
│   │   └── permission.ts    # 权限中间件
│   ├── api/                 # API 路由
│   │   ├── admin/          # 管理员 API
│   │   ├── creator/        # 创作者 API
│   │   ├── entry/          # 用户 API
│   │   └── auth/           # 认证 API
│   └── utils/              # 工具函数
│       └── permission.ts   # 权限工具
│
├── middleware/              # 前端中间件
│   ├── auth.global.ts      # 全局认证
│   └── role.ts             # 角色权限
│
├── app/                     # 前端应用
│   ├── composables/        # 组合函数
│   │   └── usePermission.ts # 权限检查
│   ├── pages/              # 页面
│   └── components/         # 组件
│
└── docs/                    # 文档
    └── ARCHITECTURE.md      # 本文件
```

## 常见问题

### Q: 为什么要分开前后端权限？
A: 前端权限用于 UI 控制和用户体验，后端权限用于真正的安全控制。它们的职责不同，应该分开处理。

### Q: 中间件会影响性能吗？
A: 中间件的性能影响很小，而且只对需要权限的路径执行检查。公开路径会直接跳过。

### Q: 如何添加新的权限规则？
A: 在 `server/middleware/permission.ts` 的 `permissionMap` 中添加新的路径和角色映射。

### Q: 前端权限可以绕过吗？
A: 前端权限只控制 UI 显示，可以被绕过。真正的安全控制在后端中间件中，无法绕过。

