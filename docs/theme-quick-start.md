# 主题系统快速开始

## 5 分钟快速上手

### 1. 数据库迁移 (1 分钟)

确保数据库正在运行，然后执行：

```bash
npx prisma migrate dev --name add_theme_model
```

或直接执行 SQL：

```bash
psql -U your_username -d your_database -f prisma/migrations/add_theme_model.sql
```

### 2. 初始化主题数据 (1 分钟)

**方式一：全新系统初始化**

如果是全新系统，使用系统初始化接口会自动创建主题数据：

```bash
# 访问 /setup 页面进行系统初始化
# 或使用 API
curl -X POST http://localhost:7061/api/system/init \
  -H "Content-Type: application/json" \
  -d '{
    "adminEmail": "admin@example.com",
    "adminUsername": "admin",
    "adminPassword": "your_password",
    "siteTitle": "我的博客",
    "siteDescription": "博客描述",
    "defaultLang": "zh"
  }'
```

**方式二：已有系统添加主题**

如果系统已初始化，单独初始化主题数据：

```bash
curl -X POST http://localhost:7061/api/system/seed-themes
```

### 3. 使用主题选择器 (1 分钟)

主题选择器已自动添加到 Header 组件中，用户可以直接使用：

1. 访问网站任意页面
2. 点击右上角的主题图标（太阳/月亮）
3. 选择主题模式（浅色/深色/跟随系统）
4. 选择主题色（蓝/绿/紫/橙/粉）

### 4. 在代码中使用主题色 (1 分钟)

只需使用 Tailwind 类名即可：

```vue
<template>
  <!-- 主色调 -->
  <button class="bg-primary-500 text-white hover:bg-primary-600">
    按钮
  </button>

  <!-- 辅助色 -->
  <div class="bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300">
    卡片
  </div>

  <!-- 强调色 -->
  <span class="border-2 border-accent-500 text-accent-600">
    徽章
  </span>
</template>
```

### 5. 查看效果 (1 分钟)

访问演示页面查看所有主题色：

```
http://localhost:7061/theme-demo
```

## 常用场景

### 场景 1: 自定义按钮颜色

```vue
<template>
  <!-- 会跟随主题色变化 -->
  <button class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
    立即体验
  </button>
</template>
```

### 场景 2: 卡片边框

```vue
<template>
  <div class="border-2 border-primary-500 rounded-lg p-4">
    <h3 class="text-primary-600 font-bold">
      标题
    </h3>
    <p class="text-gray-600 dark:text-gray-400">
      内容
    </p>
  </div>
</template>
```

### 场景 3: 徽章/标签

```vue
<template>
  <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 rounded-full text-sm">
    标签
  </span>
</template>
```

### 场景 4: 表单元素

```vue
<template>
  <input
    type="text"
    class="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
  />
</template>
```

### 场景 5: 程序化控制主题

```vue
<script setup>
const { setMode, setColorTheme, isDark } = useTheme();

// 切换到深色模式
const goDark = () => setMode('dark');

// 切换到绿色主题
const goGreen = () => setColorTheme(isDark.value ? 'dark-green' : 'light-green');

// 切换主题色（智能匹配模式）
const changeColor = (color) => {
  const mode = isDark.value ? 'dark' : 'light';
  setColorTheme(`${mode}-${color}`);
};
</script>

<template>
  <div>
    <button @click="goDark">深色模式</button>
    <button @click="goGreen">绿色主题</button>
    <button @click="changeColor('purple')">紫色主题</button>
  </div>
</template>
```

## 管理主题

访问管理页面（需要管理员权限）：

```
http://localhost:7061/admin/themes
```

在这里可以：
- 创建新主题
- 编辑现有主题
- 设置默认主题
- 启用/禁用主题
- 删除主题（非默认）

## 可用主题色

### 浅色模式
- `light-blue` - 蓝色（默认）
- `light-green` - 绿色
- `light-purple` - 紫色
- `light-orange` - 橙色
- `light-pink` - 粉色

### 深色模式
- `dark-blue` - 蓝色（默认）
- `dark-green` - 绿色
- `dark-purple` - 紫色
- `dark-orange` - 橙色
- `dark-pink` - 粉色

## 颜色深度

每种颜色都有 11 个深度级别：

- `50` - 最浅
- `100` - 很浅
- `200` - 浅
- `300` - 较浅
- `400` - 浅中
- `500` - 标准（推荐）
- `600` - 中深
- `700` - 较深
- `800` - 深
- `900` - 很深
- `950` - 最深

**使用建议：**
- 按钮背景: `500`
- 按钮悬停: `600`
- 边框: `500`
- 文字: `600` 或 `700`
- 背景色: `50` 或 `100`

## 深色模式适配

Tailwind 的 `dark:` 前缀会自动处理深色模式：

```vue
<template>
  <!-- 自动适配深色模式 -->
  <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
    内容
  </div>
  
  <!-- 主题色也会自动适配 -->
  <button class="bg-primary-500 text-white">
    按钮（深浅模式下颜色不同）
  </button>
</template>
```

## 故障排除

### 主题没有生效？
1. 检查数据库是否已迁移
2. 检查主题数据是否已初始化
3. 清除浏览器缓存
4. 检查控制台是否有错误

### 颜色显示不对？
1. 确保使用正确的类名格式：`bg-primary-500`
2. 检查是否正确配置了深色模式：`dark:bg-primary-400`
3. 查看 `assets/css/themes.css` 是否正确引入

### 主题切换无效？
1. 检查 localStorage 是否被禁用
2. 查看浏览器控制台错误信息
3. 确认 `nuxt.config.ts` 中已引入 CSS 文件

## 下一步

- 📖 查看完整文档: `docs/theme-system.md`
- 🎨 查看演示页面: `/theme-demo`
- ⚙️ 管理主题: `/admin/themes`
- 📝 查看实现总结: `THEME_SYSTEM_README.md`

---

需要帮助？查看详细文档或在 GitHub 提交 Issue。

