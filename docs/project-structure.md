# 项目文件目录设计

## 1. 根目录结构

```
i18nblog/
├── .env.example                 # 环境变量示例文件
├── .env                        # 环境变量配置文件
├── .gitignore                  # Git忽略文件
├── .nuxt/                      # Nuxt构建缓存目录（自动生成）
├── .output/                    # Nuxt构建输出目录（自动生成）
├── README.md                   # 项目说明文档
├── requirements.md             # 需求文档
├── project-structure.md        # 项目结构文档
├── functional-design.md        # 功能设计文档
├── package.json                # 项目依赖配置
├── package-lock.json           # 依赖锁定文件
├── nuxt.config.ts              # Nuxt配置文件
├── tailwind.config.js          # TailwindCSS配置
├── postcss.config.js           # PostCSS配置
├── tsconfig.json               # TypeScript配置
├── prisma/                     # Prisma数据库相关
├── assets/                     # 静态资源文件
├── components/                 # Vue组件
├── composables/                # Vue组合式函数
├── layouts/                    # 布局组件
├── middleware/                 # 中间件
├── pages/                      # 页面路由
├── plugins/                    # 插件
├── public/                     # 公共静态文件
├── server/                     # 服务端代码
├── stores/                     # 状态管理
├── types/                      # TypeScript类型定义
├── utils/                      # 工具函数
├── locales/                    # 国际化语言文件
├── tests/                      # 测试文件
└── docs/                       # 项目文档
```

## 2. 详细目录结构

### 2.1 Prisma目录 (`prisma/`)
```
prisma/
├── schema.prisma               # 数据库模式定义
├── migrations/                 # 数据库迁移文件
│   ├── 20240101000000_init/
│   │   └── migration.sql
│   └── ...
├── seed.ts                     # 数据库种子数据
└── client.ts                   # Prisma客户端配置
```

### 2.2 资源文件目录 (`assets/`)
```
assets/
├── css/                        # 样式文件
│   ├── main.css               # 主样式文件
│   ├── components.css         # 组件样式
│   └── utilities.css          # 工具样式
├── images/                     # 图片资源
│   ├── logo/                  # Logo文件
│   ├── icons/                 # 图标文件
│   └── backgrounds/           # 背景图片
├── fonts/                      # 字体文件
└── data/                       # 静态数据文件
    ├── languages.json         # 支持的语言列表
    └── themes.json            # 主题配置
```

### 2.3 组件目录 (`components/`)
```
components/
├── ui/                         # 基础UI组件
│   ├── Button.vue
│   ├── Input.vue
│   ├── Modal.vue
│   ├── Dropdown.vue
│   ├── Card.vue
│   ├── Badge.vue
│   ├── Loading.vue
│   └── index.ts               # 组件导出
├── blog/                       # 博客相关组件
│   ├── ArticleCard.vue
│   ├── ArticleList.vue
│   ├── ArticleDetail.vue
│   ├── CategoryList.vue
│   ├── TagList.vue
│   ├── SearchBox.vue
│   └── CommentSection.vue
├── admin/                      # 管理后台组件
│   ├── Dashboard.vue
│   ├── ArticleEditor.vue
│   ├── MediaManager.vue
│   ├── UserManager.vue
│   ├── SettingsPanel.vue
│   └── TranslationPanel.vue
├── layout/                     # 布局组件
│   ├── Header.vue
│   ├── Footer.vue
│   ├── Sidebar.vue
│   ├── Navigation.vue
│   └── Breadcrumb.vue
├── i18n/                       # 国际化组件
│   ├── LanguageSwitcher.vue
│   ├── TranslationEditor.vue
│   └── LanguageSelector.vue
├── theme/                      # 主题相关组件
│   ├── ThemeToggle.vue
│   ├── ThemeProvider.vue
│   └── ColorScheme.vue
└── config/                     # 配置相关组件
    ├── HtmlHeadConfig.vue
    ├── ScriptInjector.vue
    ├── StyleInjector.vue
    └── ThirdPartyConfig.vue
```

### 2.4 组合式函数目录 (`composables/`)
```
composables/
├── useAuth.ts                  # 认证相关
├── useI18n.ts                  # 国际化相关
├── useTheme.ts                 # 主题相关
├── useConfig.ts                # 配置相关
├── useApi.ts                   # API调用
├── useStorage.ts               # 本地存储
├── useTranslation.ts           # 翻译功能
├── useMedia.ts                 # 媒体管理
├── useSeo.ts                   # SEO相关
├── useValidation.ts            # 表单验证
└── useUtils.ts                 # 通用工具
```

### 2.5 布局目录 (`layouts/`)
```
layouts/
├── default.vue                 # 默认布局
├── admin.vue                   # 管理后台布局
├── blog.vue                    # 博客布局
├── minimal.vue                 # 最小化布局
└── error.vue                   # 错误页面布局
```

### 2.6 中间件目录 (`middleware/`)
```
middleware/
├── auth.ts                     # 认证中间件
├── admin.ts                    # 管理员权限中间件
├── i18n.ts                     # 国际化中间件
├── theme.ts                    # 主题中间件
├── config.ts                   # 配置中间件
└── init.ts                     # 初始化中间件
```

### 2.7 页面目录 (`pages/`)
```
pages/
├── index.vue                   # 首页
├── about.vue                   # 关于页面
├── contact.vue                 # 联系页面
├── search.vue                  # 搜索页面
├── 404.vue                     # 404错误页面
├── 500.vue                     # 500错误页面
├── admin/                      # 管理后台页面
│   ├── index.vue              # 管理后台首页
│   ├── articles/              # 文章管理
│   │   ├── index.vue
│   │   ├── create.vue
│   │   └── [id].vue
│   ├── categories/            # 分类管理
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── media/                 # 媒体管理
│   │   └── index.vue
│   ├── users/                 # 用户管理
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── settings/              # 系统设置
│   │   ├── index.vue
│   │   ├── general.vue
│   │   ├── languages.vue
│   │   ├── themes.vue
│   │   └── integrations.vue
│   └── translations/          # 翻译管理
│       └── index.vue
├── [lang]/                    # 多语言页面
│   ├── index.vue              # 语言首页
│   ├── about.vue              # 关于页面
│   ├── contact.vue            # 联系页面
│   ├── search.vue             # 搜索页面
│   ├── articles/              # 文章相关
│   │   ├── index.vue          # 文章列表
│   │   ├── [slug].vue         # 文章详情
│   │   └── category/          # 分类页面
│   │       └── [category].vue
│   └── tags/                  # 标签页面
│       └── [tag].vue
├── init/                      # 初始化页面
│   ├── index.vue              # 初始化向导
│   ├── language.vue           # 语言选择
│   ├── admin.vue              # 管理员设置
│   └── complete.vue           # 完成页面
└── api/                       # API路由（Nuxt自动处理）
    └── ...
```

### 2.8 插件目录 (`plugins/`)
```
plugins/
├── prisma.client.ts           # Prisma客户端插件
├── i18n.client.ts             # 国际化客户端插件
├── theme.client.ts            # 主题客户端插件
├── config.client.ts           # 配置客户端插件
├── analytics.client.ts        # 分析工具插件
└── utils.client.ts            # 工具函数插件
```

### 2.9 服务端目录 (`server/`)
```
server/
├── api/                       # API路由
│   ├── auth/                  # 认证相关API
│   │   ├── login.post.ts
│   │   ├── logout.post.ts
│   │   └── register.post.ts
│   ├── articles/              # 文章相关API
│   │   ├── index.get.ts
│   │   ├── [id].get.ts
│   │   ├── index.post.ts
│   │   ├── [id].put.ts
│   │   └── [id].delete.ts
│   ├── categories/            # 分类相关API
│   │   ├── index.get.ts
│   │   ├── index.post.ts
│   │   └── [id].put.ts
│   ├── media/                 # 媒体相关API
│   │   ├── upload.post.ts
│   │   └── [id].delete.ts
│   ├── translations/          # 翻译相关API
│   │   ├── translate.post.ts
│   │   └── languages.get.ts
│   ├── settings/              # 设置相关API
│   │   ├── index.get.ts
│   │   └── index.put.ts
│   └── init/                  # 初始化相关API
│       ├── status.get.ts
│       └── setup.post.ts
├── middleware/                # 服务端中间件
│   ├── auth.ts                # 认证中间件
│   ├── cors.ts                # CORS中间件
│   ├── rate-limit.ts          # 限流中间件
│   └── validation.ts          # 验证中间件
└── utils/                     # 服务端工具函数
    ├── database.ts            # 数据库工具
    ├── validation.ts          # 验证工具
    ├── translation.ts         # 翻译工具
    └── file-upload.ts         # 文件上传工具
```

### 2.10 状态管理目录 (`stores/`)
```
stores/
├── auth.ts                    # 认证状态
├── i18n.ts                    # 国际化状态
├── theme.ts                   # 主题状态
├── config.ts                  # 配置状态
├── articles.ts                # 文章状态
├── categories.ts              # 分类状态
├── media.ts                   # 媒体状态
└── ui.ts                      # UI状态
```

### 2.11 类型定义目录 (`types/`)
```
types/
├── index.ts                   # 类型导出
├── api.ts                     # API类型定义
├── auth.ts                    # 认证类型
├── article.ts                 # 文章类型
├── category.ts                # 分类类型
├── user.ts                    # 用户类型
├── config.ts                  # 配置类型
├── theme.ts                   # 主题类型
├── i18n.ts                    # 国际化类型
└── database.ts                # 数据库类型
```

### 2.12 工具函数目录 (`utils/`)
```
utils/
├── index.ts                   # 工具函数导出
├── date.ts                    # 日期处理
├── string.ts                  # 字符串处理
├── validation.ts              # 验证工具
├── seo.ts                     # SEO工具
├── image.ts                   # 图片处理
├── file.ts                    # 文件处理
├── url.ts                     # URL处理
└── constants.ts               # 常量定义
```

### 2.13 国际化目录 (`locales/`)
```
locales/
├── zh/                        # 中文语言包
│   ├── common.json
│   ├── pages.json
│   ├── admin.json
│   └── validation.json
├── en/                        # 英文语言包
│   ├── common.json
│   ├── pages.json
│   ├── admin.json
│   └── validation.json
├── ja/                        # 日文语言包
│   ├── common.json
│   ├── pages.json
│   ├── admin.json
│   └── validation.json
└── index.ts                   # 语言包配置
```

### 2.14 测试目录 (`tests/`)
```
tests/
├── unit/                      # 单元测试
│   ├── components/
│   ├── composables/
│   ├── utils/
│   └── stores/
├── integration/               # 集成测试
│   ├── api/
│   └── pages/
├── e2e/                       # 端到端测试
│   ├── admin.spec.ts
│   ├── blog.spec.ts
│   └── i18n.spec.ts
├── fixtures/                  # 测试数据
│   ├── articles.json
│   ├── users.json
│   └── categories.json
└── setup/                     # 测试配置
    ├── vitest.config.ts
    └── playwright.config.ts
```

### 2.15 文档目录 (`docs/`)
```
docs/
├── api/                       # API文档
│   ├── auth.md
│   ├── articles.md
│   └── settings.md
├── deployment/                # 部署文档
│   ├── docker.md
│   ├── vercel.md
│   └── self-hosted.md
├── development/               # 开发文档
│   ├── setup.md
│   ├── contributing.md
│   └── architecture.md
└── user/                      # 用户文档
    ├── getting-started.md
    ├── configuration.md
    └── troubleshooting.md
```

## 3. 配置文件说明

### 3.1 核心配置文件
- `nuxt.config.ts`: Nuxt 3主配置文件，包含模块配置、构建配置等
- `tailwind.config.js`: TailwindCSS配置，包含主题、插件等
- `tsconfig.json`: TypeScript配置，包含编译选项、路径映射等
- `package.json`: 项目依赖和脚本配置

### 3.2 环境配置文件
- `.env.example`: 环境变量示例文件
- `.env`: 实际环境变量文件（不提交到版本控制）
- `.env.production`: 生产环境变量文件
- `.env.development`: 开发环境变量文件

### 3.3 构建配置文件
- `postcss.config.js`: PostCSS配置
- `vite.config.ts`: Vite构建配置（如果需要自定义）
- `vitest.config.ts`: 测试配置
- `playwright.config.ts`: E2E测试配置

## 4. 目录设计原则

### 4.1 模块化原则
- 按功能模块组织代码
- 每个模块职责单一
- 模块间低耦合高内聚

### 4.2 可扩展性原则
- 预留扩展接口
- 支持插件机制
- 配置与代码分离

### 4.3 可维护性原则
- 清晰的目录结构
- 统一的命名规范
- 完整的文档支持

### 4.4 性能优化原则
- 按需加载设计
- 资源优化配置
- 缓存策略支持
