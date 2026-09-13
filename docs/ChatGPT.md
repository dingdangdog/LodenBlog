# Nuxt3 + Prisma + TailwindCSS 博客项目设计文档

> 本文档包含三部分：
>
> 1. 需求文档（纯文字，**不包含任何代码**）
> 2. 项目文件目录设计（树状结构，便于实现与扩展）
> 3. 功能/代码设计（高层架构、模块职责、接口契约、数据流与实现要点 — 说明性设计，不含具体实现代码）

---

## 一、项目简介与目标

目标是构建一个面向多语言内容创作的现代博客系统，基于 Nuxt 3（SSR）、Prisma（数据库 ORM）、TailwindCSS（样式），支持：

* 部署后第一次初始化向导，可选择默认语言（以及其它初始化设置）
* 编辑任意语言的文章时，提供自动 i18n 翻译（可选的自动机器翻译或人工翻译工作流）
* 语言切换支持且“每个语言的文章 URL 不同”（语言作为 URL 的一部分：例如 `/en/...`、`/zh-CN/...`），所有页面采用 SSR 渲染以利于 SEO
* 明暗主题切换（用户可在客户端切换并记忆偏好）
* 通过配置注入网站 head / scripts / css 等（支持插入第三方脚本，如 Google Analytics、广告脚本、验证 meta 等）

项目面向可扩展性与生产环境部署：考虑多语言 SEO、缓存、授权、多环境配置、备份/迁移。

---

## 二、不变性与约束（非功能性需求）

1. **渲染与 SEO**：所有公开页面均以 SSR（Server-Side Rendering）方式呈现，并生成可被搜索引擎抓取的静态 meta 信息。
2. **多语言路由**：每种语言对应独立 URL，且路由必须兼容原生路径（不使用仅查询参数切换语言）。
3. **安全性**：默认启用 CSRF 防护、输入消毒（特别是 HTML/富文本）、对第三方脚本做 CSP/白名单提示。
4. **可配置性**：管理员可以通过配置界面或环境变量注入头部 scripts/meta/css，且支持按环境区分（dev/stage/prod）。
5. **响应性能**：应支持缓存（边缘缓存/服务端缓存）和分页，资产使用 CDN 或前端构建策略优化。
6. **可扩展性**：数据库模型与服务设计应方便增加站点插件（如评论、会员）和多站点支持（未来扩展）。
7. **隐私合规**：若启用第三方分析/广告应给用户展示隐私告知及选择权（如同意后加载脚本）。

---

## 三、主要用户角色与用户故事

* **访客（Guest）**：能查看文章、按语言/分类/标签浏览、切换语言与主题。
* **注册用户（Reader）**：能收藏、订阅特定作者或主题（可选）。
* **作者（Author）**：能创建/编辑/删除文章、上传图片、发起翻译、查看文章版本历史。
* **管理员（Admin）**：管理用户、网站全局配置（site head 注入、默认语言、翻译策略、主题默认值）、初始化系统。

主要用户故事举例：

1. 作为管理员，我可以在第一次部署时运行初始化向导并选择默认语言与站点基本信息。
2. 作为作者，我可以以任意语言创建文章，并在保存时选择是否自动翻译为其他启用的语言。
3. 作为访客，我在切换语言后能访问相应语言的完整 URL，并且 SEO meta（例如 hreflang）被正确设置。
4. 作为用户，我可以在客户端在明暗主题间切换，首选项会被存储以便下次生效。
5. 作为管理员，我可以在站点配置中注入自定义 head scripts（如 Google Analytics），并能选择是否在 GDPR 区域默认不加载脚本。

---

## 四、功能细化（需求项）

### 1. 初始化向导

* 第一次部署后管理员访问 `/setup`（或通过 CLI）触发初始化向导。
* 向导内容：站点名称、默认语言（必选）、启用语言列表、管理员账户（用户名/邮箱/密码）、是否启用自动翻译、默认主题（light/dark/auto）、是否注入预设 head 脚本。
* 向导完成后写入首个配置到数据库或配置文件，并关闭向导访问（仅管理员可重新运行/重置）。

### 2. 多语言支持与 URL 规划

* 每个 language 拥有独立前缀：例如 `/`, `/en/`, `/zh-CN/`。默认语言可决定是否使用无前缀或使用显式前缀（建议统一使用前缀以简化路由）。
* 每篇文章的每种语言版本都对应一条独立记录（或语言映射），其路径与 slug 联动：`/:lang/articles/:slug`。
* 必须生成并维护 `hreflang` 标签以及站点地图 sitemap（包含语言版本）。

### 3. 内容模型与编辑体验

* 支持富文本或 Markdown 编辑（富文本需要进行 XSS 过滤/白名单）。
* 编辑器支持图片上传（到本地文件夹或外部对象存储）、草稿与发布流程、版本历史。
* 在编写文章时，作者可选择“自动翻译到哪些语言”。自动翻译将通过后台任务调用翻译服务并把翻译结果保存为目标语言的文章草稿/已发布版本，翻译来源应保留原文语言标识与翻译质量标注。

### 4. 语言切换与路由保持

* 当用户在某一文章页面切换语言，系统应尝试导航到相应语言的文章（若存在），否则可：

  * 跳转到该文章的语言版本（如果无则跳回文章列表或显示“未翻译”提示）；
  * 或显示翻译请求/建议（作者/管理员可根据策略选择是否允许访客请求翻译）。
* 站内所有链接应包含语言前缀，服务端渲染时必须基于当前路由语言渲染相应翻译内容。

### 5. 自动 i18n 翻译（工作流）

* 自动翻译为可选功能，由管理员在站点设置中控制（开启/关闭/按语言对翻译服务配置 API key）。
* 翻译请求应以后台任务队列处理（避免阻塞请求）。
* 翻译结果应保存并标记来源（机器/人工）、质量（如质量得分、审校状态），并允许作者审校后再发布。

### 6. 主题（明/暗）与首选项持久化

* 客户端提供主题切换控件。首选项采用：localStorage + cookie（或用户登录后存入用户资料），服务端 SSR 时根据 cookie/用户设置决定初始渲染主题。

### 7. 头部脚本/样式注入配置

* 管理端提供 UI 来添加/管理：

  * 自定义 meta tags
  * 外部脚本（script 标签，支持 async/defer、注入位置 head/body）
  * 自定义 CSS 链接或内联 CSS
* 配置项需按环境与区域（如 GDPR）支持条件加载与开关。

### 8. 权限与安全

* 支持基于角色的权限（Admin / Author / Reader / Guest）。
* 管理后台接口需启用身份认证和权限校验。密码使用安全哈希策略存储，支持 OAuth 第三方登录（可选）。
* 输入消毒（尤其是 HTML）与上传文件类型校验。

### 9. 日志、监控与备份

* 提供审计日志（重要操作如文章删除、用户权限变更）。
* 支持数据库备份机制与迁移文档。

---

## 五、SEO 与 可访问性

* 所有语言版本页面需具备语言特定的 meta（title、description）、结构化数据（JSON-LD）、hreflang 标注与 language-specific sitemap。
* 对图片添加 alt，确保页面可访问性（WCAG 基本遵从）。

---

## 六、错误/降级策略

* 当翻译服务不可用时：保证原文正常发布，并在 UI 显示“翻译服务不可用”的提示。
* 第三方脚本加载失败时不影响页面主要功能（脚本使用异步加载并包裹错误处理）。

---

# 七、项目文件目录设计（建议）

```
nuxt3-blog/
├── README.md
├── .env.example
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma      # 数据模型（描述性说明 — 实际代码可放置于此）
│   └── migrations/
├── server/                # Nuxt 3 server 路径（server routes & utils）
│   ├── api/
│   │   ├── auth/          # 登录、登出、session 管理接口
│   │   ├── admin/         # 管理面板专用接口（site config, head scripts）
│   │   ├── articles/      # 文章 CRUD、翻译触发、版本历史
│   │   └── uploads/       # 图片/资源上传接口
│   ├── workers/           # 后台任务（翻译、异步处理）
│   └── utils/             # server 端通用工具（i18n helpers, csrf, rate-limit）
├── composables/           # Nuxt composables（useAuth, useI18n, useTheme...）
├── components/
│   ├── ui/                # 基础 UI（Button, Icon, ThemeToggle...）
│   ├── layout/            # 布局相关（Header, Footer, Nav）
│   ├── article/           # 文章展示/列表/summary 组件
│   └── admin/             # 管理后台共用组件
├── content/               # 可选：静态内容/markdown 存放（若混合 SSG）
├── pages/                 # Nuxt 页面（使用语言前缀路由）
│   ├── [lang]/
│   │   ├── index.vue
│   │   ├── articles/
│   │   │   └── [slug].vue
│   │   └── admin/
├── layouts/
├── stores/                # Pinia stores（auth, theme, siteConfig）
├── public/                # 静态资源
├── assets/                # tailwind / 全局样式
├── i18n/                  # i18n 配置、语言包、翻译策略
├── scripts/               # 部署、迁移或初始化脚本（如 init.sh / npm run setup）
└── docs/                  # 项目文档（包含迁移与运维说明）
```

> 说明：建议将 `pages/[lang]/...` 设计为路由约束，`lang` 可由站点配置的启用语言集动态校验。

---

# 八、功能代码设计（高层）

以下为模块划分、职责、主要接口与数据流说明。

## 架构概览

* **前端（Nuxt 3 + Tailwind）**：负责 UI、路由、SSR 渲染，基于语言进行请求并服务服务端渲染的内容。
* **后端（Nuxt server handlers + Prisma）**：数据库访问由 Prisma 执行，server/api 提供 REST/JSON 的接口（或使用 RPC 风格），负责鉴权、内容 CRUD、后台任务触发与配置管理。
* **后台任务/队列**：处理耗时任务（自动翻译、图片处理、缓存刷新）。可在初期用内置队列实现，生产可替换为 Redis/ Bull/ RabbitMQ。
* **存储**：文章、用户和站点配置存 DB（Postgres/MySQL），图片可选本地或对象存储（S3 兼容）。

## 数据模型（概念层，禁止代码）

* **User**：id、email、name、hashedPassword、role、preferredLanguage、themePreference、createdAt、updatedAt。
* **Article**：id、authorId、defaultSlug、createdAt、updatedAt、status（draft/published/archived）、coverImage、meta（json）等。
* **ArticleTranslation**：id、articleId、language、title、slug、content（富文本或 markdown）、excerpt、seoTitle、seoDescription、publishedAt、translationSource（original/machine/manual）、translationStatus（untranslated/queued/done/needs\_review）。
* **SiteConfig**：domain、defaultLanguage、enabledLanguages、headInjectionList（数组），themeDefault、privacySettings 等。
* **Upload**：id、ownerId、url、mimeType、size、createdAt。
* **AuditLog**：actorId、action、targetType、targetId、detail、createdAt。

> 说明：把翻译与文章做成独立实体可以更灵活地管理每种语言的元数据与路由。

## 主要 Server 接口（契约式描述）

* `POST /api/admin/setup` — 初始化站点配置（仅初次可用）。
* `GET /api/site/config` — 获取站点全局配置（用于服务端渲染时插入 head/meta）。
* `GET /api/:lang/articles/:slug` — 获取某语言的文章内容（SSR 使用）。
* `POST /api/:lang/articles` — 创建文章（携带语言字段），返回 articleId 与 translationId。
* `PATCH /api/:lang/articles/:slug` — 更新文章（可触发翻译队列）。
* `POST /api/admin/translate` — 请求将某文章翻译到一或多个语言（后台队列执行）。
* `POST /api/uploads` — 上传图片资源，返回 URL。
* `GET /api/admin/head` / `POST /api/admin/head` — 管理头部注入配置。

> 以上接口应做权限验证与输入校验，且对耗时操作（翻译）返回任务 id 或队列状态。

## 前端模块设计与数据流

1. **页面请求与 SSR**：

   * 浏览器访问 `GET /en/articles/slug`，Nuxt 服务端中间件解析 `lang`，调用 `GET /api/en/articles/slug` 获取 translation 数据与 site config，然后服务端渲染页面并插入相应的 head（title/meta/hreflang）。
2. **编辑器**：

   * 编辑器页面允许作者选择文章语言并保存。保存时会调用 `POST /api/:lang/articles` 或 `PATCH`。
   * 若选择自动翻译，会在保存后调用 `POST /api/admin/translate`，后者将创建队列任务并返回任务状态；编辑器展示任务状态并允许作者审校结果。
3. **语言切换器**：

   * 组件读取当前路由 `lang`，调用站点配置获得启用语言列表并构建目标 URL（若目标 URL 不存在对应翻译，则依据策略提供 fallback）。
4. **头部注入加载**：

   * 在客户端或服务端渲染期间，读取 `siteConfig.headInjectionList`，并根据用户隐私/区域与环境条件决定是否插入脚本（例如需要用户同意后才加载 analytics）。

## 后台任务与翻译流程（工作流）

1. 作者保存一篇新文章（语言 A）。
2. 如果作者选择自动翻译到语言 B/C，后端创建翻译任务条目并将任务推入队列。
3. Worker 异步取出任务，调用配置的机器翻译服务（或企业翻译 API），获取结果并保存为 `ArticleTranslation`，标注 `translationSource=machine` 且 `translationStatus=done`（或 needs\_review）。
4. 系统通知作者（站内通知或邮件）翻译完成，可供审校后正式发布。
5. 若翻译失败，记录到日志并触发重试策略或人工干预提醒。

## 主题切换实现要点

* SSR 初始渲染使用 cookie（或 user profile）读取用户主题偏好并注入到 `html`/`body`（如 class `theme-dark`），以避免闪烁。
* 客户端切换更新 localStorage + cookie，并触发 CSS class 切换，同时可调用后端保存用户偏好（若已登录）。

## 头部注入的安全考虑

* 在 UI 上对可注入脚本做白名单/预览，并限制仅 Admin 操作。
* 对注入的脚本添加 `nonce` 或 CSP 指令提示，提供“按需加载”（如用户同意的情况下）选项，以降低 XSS/隐私风险。

---

# 九、部署与运维建议（概要）

* 推荐数据库：Postgres（迁移友好、json 支持好）。
* 推荐部署：使用支持 SSR 的托管（如 Vercel/自建 Node 环境 / Docker + Kubernetes），并在前端资源上配置 CDN。
* 备份：定期导出数据库和对象存储文件，保留迁移历史。
* 环境配置分层（dev/stage/prod），并使用 Secrets 管理翻译 API keys 与第三方脚本 keys。

---

# 十、后续可选扩展（Roadmap）

* 支持多站点（multi-tenant）
* 支持本地化的日期/货币/SEO 标注
* 编辑器集成协同编辑与审校流
* 集成付费墙 / 会员订阅
* 自动生成语言特定的 RSS/ATOM

---

### 结束语

本文档给出需求、目录与功能设计的完整高层蓝图，覆盖初始化、多语言 URL 与翻译工作流、SSR 要点、头部注入与安全等关键点。若你希望我将以上任一部分转换为更具体的实现计划（例如：数据库 schema 的 Prisma 模型草案、Nuxt 路由与 middlewares 的具体设计、或管理端界面原型），我可以在下步提供（那将包含代码/示例）。
