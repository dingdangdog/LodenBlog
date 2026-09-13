# 数据库自动初始化功能

## 概述

服务器启动时会自动检查并初始化基础数据，确保系统具备最基本的运行条件。

## 功能特性

### 自动初始化的数据

1. **默认语言** (3种)
   - 中文 (zh) - 默认
   - 英语 (en)
   - 日语 (ja)

2. **默认主题** (10个)
   - 浅色主题: 蓝、绿、紫、橙、粉
   - 深色主题: 蓝、绿、紫、橙、粉

3. **默认分类** (4个×语言数)
   - 未分类 (uncategorized)
   - 技术 (technology)
   - 生活 (lifestyle)
   - 旅行 (travel)

4. **默认标签** (可选，5个×语言数)
   - 教程 (tutorial)
   - 指南 (guide)
   - 新闻 (news)
   - 评测 (review)
   - 更新 (update)

## 工作原理

### 1. 触发时机

插件在 Nuxt 服务器启动时自动执行，位于 `server/plugins/init-db.ts`。

构建镜像时不连库。容器（或本地 `nuxt dev`）进程启动后，会先调用 `ensureDatabaseMigrations()` 把 `prisma/migrations` 同步到 PostgreSQL，再检查并写入种子数据。

### 2. 检查机制

- 每次服务器启动都会先同步 schema（可用 `DATABASE_AUTO_MIGRATE=false` 关闭）
- 每次服务器启动都会检查种子数据是否存在
- 只有当数据表为空时才会创建种子数据
- 不会覆盖或删除已有数据
- schema 同步失败会中断启动；种子数据出错时只记录错误

### 3. 执行流程

```
服务器启动
    ↓
应用 prisma/migrations（空库建表 / 补未应用迁移 / 必要时 baseline）
    ↓
检查配置是否启用种子初始化
    ↓
检查语言数据 → 不存在则创建
    ↓
检查主题数据 → 不存在则创建
    ↓
检查分类数据 → 不存在则创建
    ↓
检查标签数据 → 不存在则创建（可选）
    ↓
完成
```

## 配置选项

配置文件位于 `server/config/db-init.config.ts`

### 全局开关

```typescript
export const dbInitConfig = {
  // 是否启用自动初始化
  enabled: true,
  // ...
}
```

### 语言配置

```typescript
languages: {
  enabled: true,  // 是否初始化语言
  data: [
    // 语言数据数组
  ]
}
```

### 主题配置

```typescript
themes: {
  enabled: true,  // 是否初始化主题
}
```

### 分类配置

```typescript
categories: {
  enabled: true,  // 是否初始化分类
  templates: [
    // 分类模板数组
  ]
}
```

### 标签配置

```typescript
tags: {
  enabled: false, // 是否初始化标签（默认禁用）
  templates: [
    // 标签模板数组
  ]
}
```

## 自定义配置

### 1. 禁用自动初始化

```typescript
// server/config/db-init.config.ts
export const dbInitConfig = {
  enabled: false,
  // ...
}
```

### 2. 只初始化部分数据

```typescript
export const dbInitConfig = {
  enabled: true,
  languages: { enabled: true, data: [...] },
  themes: { enabled: true },
  categories: { enabled: false },  // 不初始化分类
  tags: { enabled: false },        // 不初始化标签
}
```

### 3. 添加自定义语言

```typescript
languages: {
  enabled: true,
  data: [
    // ...已有语言
    {
      code: "fr",
      name: "French",
      nativeName: "Français",
      isActive: true,
      isDefault: false,
      sortOrder: 4,
    },
  ]
}
```

### 4. 添加自定义分类

```typescript
categories: {
  enabled: true,
  templates: [
    // ...已有分类
    {
      slug: "photography",
      names: {
        zh: "摄影",
        en: "Photography",
        ja: "写真",
      },
      descriptions: {
        zh: "摄影相关文章",
        en: "Photography related articles",
        ja: "写真関連の記事",
      },
      sortOrder: 4,
    },
  ]
}
```

### 5. 启用标签初始化

```typescript
tags: {
  enabled: true,  // 改为 true
  templates: [
    // ...默认标签
  ]
}
```

## 日志输出

服务器启动时会输出详细的初始化日志：

```
🔧 开始检查数据库基础数据...
📝 初始化默认语言...
✅ 已创建 3 种默认语言
🎨 初始化默认主题...
✅ 已创建 10 个默认主题
📂 初始化默认分类...
✅ 已创建 12 个默认分类
✅ 数据库基础数据检查完成
```

如果数据已存在：

```
🔧 开始检查数据库基础数据...
ℹ️  语言数据已存在 (3 种)
ℹ️  主题数据已存在 (10 个)
ℹ️  分类数据已存在 (12 个)
✅ 数据库基础数据检查完成
```

## 与系统初始化的关系

### 自动初始化 (server/plugins/init-db.ts)
- 服务器启动时自动执行
- 只初始化基础数据（语言、主题、分类、标签）
- 不创建管理员账户
- 不创建系统设置

### 系统初始化 (POST /api/system/init)
- 需要手动调用（通过 /setup 页面或 API）
- 创建管理员账户
- 创建系统设置
- 也会初始化基础数据（语言、主题、分类）
- 只能执行一次

### 推荐流程

**方式一：使用系统初始化（推荐）**

1. 启动服务器（自动初始化基础数据）
2. 访问 `/setup` 页面
3. 填写管理员信息和站点信息
4. 完成系统初始化

**方式二：自动初始化 + 手动配置**

1. 启动服务器（自动初始化基础数据）
2. 直接使用，但需要手动创建管理员账户

## 数据依赖关系

```
语言 (Language)
    ↓ (必需)
分类 (Category)
标签 (Tag)

主题 (Theme)
    ↓ (独立)
无依赖
```

- 分类和标签必须依赖语言存在
- 主题是独立的，不依赖其他数据

## 故障排除

### 1. 初始化失败

**症状**: 控制台显示 "❌ 数据库初始化失败"

**可能原因**:
- 数据库未启动
- 数据库连接配置错误
- Prisma schema 同步失败（查看日志中的 `[db:migrate]`）

**解决方法**:
```bash
# 检查数据库状态
psql -U postgres -l

# 检查 Prisma 配置
npx prisma validate

# 查看容器启动迁移日志（关键字 [db:migrate]）
docker compose logs app
```

本地开发仍可用 `npx prisma migrate dev` 生成新的 migration；生产路径以启动时自动同步为准。不要手写 migration SQL。

### 2. 数据重复

**症状**: 提示唯一约束冲突

**可能原因**:
- 手动创建了相同的数据
- 修改了配置但未清理旧数据

**解决方法**:
```bash
# 清空相关表（谨慎操作！）
DELETE FROM categories;
DELETE FROM tags;
DELETE FROM themes;
DELETE FROM languages;
```

### 3. 部分数据未创建

**症状**: 只创建了部分数据

**可能原因**:
- 某个模块的 enabled 设置为 false
- 数据库中已有部分数据

**解决方法**:
- 检查配置文件中的 enabled 选项
- 查看控制台日志确认哪些数据被跳过

### 4. 服务器启动慢

**症状**: 服务器启动时间过长

**可能原因**:
- 数据库响应慢
- 创建大量数据

**解决方法**:
- 优化数据库连接
- 减少初始化的数据量
- 考虑禁用不必要的模块

## 最佳实践

1. **开发环境**: 启用所有自动初始化，方便快速开始
2. **生产环境**: 首次部署时启用，之后可以禁用
3. **测试环境**: 每次测试前清空数据库，依赖自动初始化
4. **自定义数据**: 通过配置文件添加，而不是直接修改代码
5. **错误处理**: 定期检查日志，确保初始化正常

## 扩展开发

### 添加新的初始化模块

1. 在配置文件中添加配置：

```typescript
// server/config/db-init.config.ts
export const dbInitConfig = {
  // ...
  customData: {
    enabled: true,
    data: [...]
  }
}
```

2. 在插件中添加初始化函数：

```typescript
// server/plugins/init-db.ts
async function initCustomData() {
  // 实现初始化逻辑
}

// 在主函数中调用
if (dbInitConfig.customData.enabled) {
  await initCustomData();
}
```

### 数据模板系统

对于多语言数据，使用统一的模板格式：

```typescript
{
  slug: "unique-identifier",
  names: {
    zh: "中文名称",
    en: "English Name",
    ja: "日本語名",
  },
  descriptions: {
    zh: "中文描述",
    en: "English Description",
    ja: "日本語説明",
  },
  // 其他字段...
}
```

## 相关文件

- `server/plugins/init-db.ts` - 初始化插件主文件
- `server/config/db-init.config.ts` - 初始化配置文件
- `server/api/system/init.post.ts` - 系统初始化 API
- `server/api/system/seed.post.ts` - 种子数据 API

## 总结

数据库自动初始化功能确保了系统在启动时就具备基本的运行条件，无需手动创建基础数据。通过灵活的配置系统，可以根据不同环境和需求定制初始化行为。

