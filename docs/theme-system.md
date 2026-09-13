# 主题系统使用指南

## 概述

本系统实现了一个完整的主题管理系统，支持明暗模式和多种主题色系的切换。

## 功能特性

### 1. 主题模式
- **浅色模式 (Light)**: 适合日间使用的亮色主题
- **深色模式 (Dark)**: 适合夜间使用的暗色主题
- **跟随系统 (System)**: 自动跟随操作系统的主题设置

### 2. 主题色系

#### 浅色主题
- 蓝色 (light-blue) - 默认
- 绿色 (light-green)
- 紫色 (light-purple)
- 橙色 (light-orange)
- 粉色 (light-pink)

#### 深色主题
- 蓝色 (dark-blue) - 默认
- 绿色 (dark-green)
- 紫色 (dark-purple)
- 橙色 (dark-orange)
- 粉色 (dark-pink)

## 技术实现

### 1. 数据库模型

在 `prisma/schema.prisma` 中定义了 `Theme` 模型：

```prisma
model Theme {
  id          String   @id @default(cuid())
  name        String   @unique
  displayName String
  mode        String   // 'light' or 'dark'
  colors      String   // JSON 格式存储色彩配置
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2. Tailwind CSS 配置

使用 CSS 变量实现动态主题切换，在 `assets/css/themes.css` 中定义了所有主题色：

- 使用 `--color-primary-*` 定义主色调
- 使用 `--color-secondary-*` 定义辅助色
- 使用 `--color-accent-*` 定义强调色

在 `tailwind.config.js` 中配置颜色映射：

```javascript
colors: {
  primary: {
    500: 'rgb(var(--color-primary-500) / <alpha-value>)',
    // ...
  },
}
```

### 3. Store 管理

`app/stores/theme.ts` 提供主题状态管理：

```typescript
const themeStore = useThemeStore();

// 设置主题模式
themeStore.setMode('dark');

// 设置主题色
themeStore.setColorTheme('dark-green');

// 切换模式
themeStore.toggleMode();
```

### 4. 组件

#### ThemeSelector 组件
位于 `app/components/common/ThemeSelector.vue`，提供完整的主题选择界面。

使用方法：
```vue
<template>
  <CommonThemeSelector />
</template>
```

#### 旧版 ThemeToggle 组件
位于 `app/components/common/ThemeToggle.vue`，仍然可用，只提供简单的明暗切换。

## API 接口

### 公共接口

#### 获取所有主题
```
GET /api/themes
```

返回所有激活的主题列表。

#### 获取默认主题
```
GET /api/themes/active
```

返回当前默认主题。

### 管理员接口

#### 创建主题
```
POST /api/admin/themes
```

请求体：
```json
{
  "name": "light-red",
  "displayName": "红色",
  "mode": "light",
  "colors": {
    "primary": "#EF4444",
    "secondary": "#64748B",
    "accent": "#F87171"
  },
  "isDefault": false,
  "sortOrder": 10
}
```

#### 更新主题
```
PATCH /api/admin/themes/:id
```

#### 删除主题
```
DELETE /api/admin/themes/:id
```

注意：默认主题不能被删除。

### 初始化主题数据
```
POST /api/system/seed-themes
```

初始化 10 个预设主题（5 个浅色 + 5 个深色）。

## 使用示例

### 1. 在组件中使用主题

```vue
<template>
  <div>
    <button class="bg-primary-500 text-white hover:bg-primary-600">
      主要按钮
    </button>
    <button class="bg-secondary-500 text-white hover:bg-secondary-600">
      次要按钮
    </button>
    <button class="bg-accent-500 text-white hover:bg-accent-600">
      强调按钮
    </button>
  </div>
</template>
```

### 2. 在 composable 中使用

```typescript
const { 
  currentMode,
  currentColorTheme,
  isDark,
  setMode,
  setColorTheme 
} = useTheme();

// 检查当前模式
console.log(currentMode.value); // 'light', 'dark', or 'system'

// 设置主题色
setColorTheme('dark-purple');
```

### 3. 管理主题

访问 `/admin/themes` 页面进行主题管理（需要管理员权限）。

## 数据库初始化

1. 启动数据库服务器

2. 运行迁移：
```bash
npx prisma migrate dev --name add_theme_model
```

或手动执行 SQL：
```bash
psql -d your_database < prisma/migrations/add_theme_model.sql
```

3. 初始化主题数据：
```bash
curl -X POST http://localhost:7061/api/system/seed-themes
```

或在系统设置页面点击"初始化主题数据"。

## 扩展自定义主题

### 1. 添加新的主题色

编辑 `assets/css/themes.css`，添加新的主题色定义：

```css
/* 浅色主题 - 红色 */
[data-theme="light-red"] {
  --color-primary-50: 254 242 242;
  --color-primary-100: 254 226 226;
  /* ... */
  --color-primary-500: 239 68 68;
  /* ... */
}
```

### 2. 在数据库中注册主题

通过管理界面或 API 创建新主题记录。

### 3. 更新主题列表

在 `app/stores/theme.ts` 中的 `availableThemes` 添加新主题：

```typescript
const availableThemes = {
  light: [
    // ...
    { name: 'light-red', displayName: '红色', primary: '#EF4444' },
  ],
  // ...
};
```

## 注意事项

1. **CSS 变量格式**: 颜色值使用 RGB 格式（不含 `rgb()` 包装），例如 `239 68 68` 而不是 `#EF4444`

2. **主题命名规范**: 主题名称格式为 `{mode}-{color}`，例如 `light-blue`, `dark-green`

3. **默认主题**: 每种模式（light/dark）只能有一个默认主题

4. **浏览器兼容性**: CSS 变量特性需要现代浏览器支持

5. **性能优化**: 主题切换是即时的，不需要刷新页面

## 故障排除

### 主题未生效
1. 检查 CSS 文件是否正确引入
2. 检查 `nuxt.config.ts` 中的 `css` 配置
3. 清除浏览器缓存

### 颜色显示不正确
1. 检查 CSS 变量定义是否正确
2. 检查 Tailwind 配置是否正确映射
3. 使用开发者工具检查计算后的样式

### 主题切换不持久
1. 检查 localStorage 是否可用
2. 检查浏览器隐私设置
3. 查看控制台错误信息

