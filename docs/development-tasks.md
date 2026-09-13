## 可执行开发任务清单（i18n Blog）

> 本文档是面向执行的任务列表，可按顺序逐项完成。若无特殊说明，默认优先级从上到下递减。

---

### 1. 第一阶段：数据库与基础配置（P0）

#### 1.1 数据库 Schema 调整

- [ ] 在 `prisma/schema.prisma` 中移除所有 Prisma 显式关系定义  
  - [ ] 搜索并删除所有 `@relation(...)` 配置  
  - [ ] 删除 `references`、`onDelete` 等关系相关参数  
  - [ ] 确认各外键字段（如 `authorId`、`categoryId` 等）仍然保留且类型正确  
- [ ] 添加 `Creator` 模型  
  - [ ] 按开发方案 2.1.2 中的定义添加 `Creator` 表  
  - [ ] 确认 `userId` 为 `String @unique @db.VarChar(36)`  
- [ ] 添加 `TranslationConfig` 模型  
  - [ ] 按开发方案 2.1.3 中的定义添加 `TranslationConfig` 表  
- [ ] 添加 `ArticleLike` 模型  
  - [ ] 按开发方案 2.1.4 中的定义添加 `ArticleLike` 表  
- [ ] 扩展 `Setting` 模型  
  - [ ] 按开发方案 2.1.5 中的定义添加 i18n 及自定义 HTML/CSS/JS 相关字段  
- [ ] 生成并执行数据库迁移  
  - [ ] 运行 `npx prisma migrate dev --name init_i18nblog_adjustments`  
  - [ ] 使用 `npx prisma studio` 检查表结构是否符合预期  

#### 1.2 Nuxt 基础配置

- [ ] 完成 i18n 配置  
  - [ ] 打开 `nuxt.config.ts`，在 `defineNuxtConfig` 中加入开发方案 2.2.1 提供的 `i18n` 配置块  
  - [ ] 新建 `i18n.config.ts`，添加最小示例配置（至少包含 zh/en/ja 三种语言）  
- [ ] 完成认证模块配置  
  - [ ] 在 `nuxt.config.ts` 中加入开发方案 2.2.2 提供的 `auth` 配置块  
  - [ ] 在 `env` 中补充 `AUTH_ORIGIN` 等必要环境变量  
  - [ ] 确认 `@sidebase/nuxt-auth` 已在 `modules` 中启用  

---

### 2. 第二阶段：认证与基础前端框架（P0）

#### 2.1 认证 API 实现

- [ ] 实现 `POST /api/auth/login`  
  - [ ] 接收账号（邮箱/用户名）和密码  
  - [ ] 使用 Prisma 查询用户并校验加密密码  
  - [ ] 创建会话或 JWT（对接 `nuxt-auth`）  
  - [ ] 使用 `server/utils/result.ts` 统一返回格式  
- [ ] 实现 `POST /api/auth/register`  
  - [ ] 接收注册信息创建 `User` 记录  
  - [ ] （可选）为创作者自动创建 `Creator` 记录  
- [ ] 实现 `POST /api/auth/logout`  
  - [ ] 调用 `nuxt-auth` 的登出功能，清理 session/token  
- [ ] 实现 `GET /api/me`  
  - [ ] 返回当前登录用户基础信息  
- [ ] 实现 `PATCH /api/me`  
  - [ ] 允许更新昵称、头像等非敏感字段  

#### 2.2 前端基础结构与布局

- [ ] 创建核心目录和文件（先可空实现）  
  - [ ] `app/pages/[lang]/index.vue`  
  - [ ] `app/pages/[lang]/post/[slug].vue`  
  - [ ] `app/pages/admin/index.vue`  
  - [ ] `app/layouts/default.vue`  
  - [ ] `app/layouts/admin.vue`  
  - [ ] `app/components/common/Header.vue`  
  - [ ] `app/components/common/Footer.vue`  
  - [ ] `app/components/common/LanguageSwitcher.vue`  
  - [ ] `app/components/common/ThemeToggle.vue`  
  - [ ] `app/components/common/ShareButtons.vue`  
  - [ ] `app/stores/auth.ts`, `app/stores/theme.ts`, `app/stores/i18n.ts`, `app/stores/app.ts`  
  - [ ] `app/composables/useAuth.ts`, `app/composables/useTheme.ts`, `app/composables/useSEO.ts`  
- [ ] 搭建默认布局  
  - [ ] 在 `layouts/default.vue` 中实现：顶部导航 + 主内容插槽 + 页脚  
  - [ ] 在 `app/app.vue` 中使用 `NuxtLayout` 与 `NuxtPage`  
- [ ] 实现语言切换组件  
  - [ ] 在 `LanguageSwitcher.vue` 中使用 `useI18n`、`useLocalePath`  
  - [ ] 实现 zh/en/ja 切换并验证路由前缀正常  

---

### 3. 第三阶段：文章与后台基础（P0/P1）

#### 3.1 文章 API（P0）

- [ ] 实现 `GET /api/articles`  
  - [ ] 支持分页与语言过滤  
- [ ] 实现 `GET /api/articles/[slug]`  
  - [ ] 根据 `slug + languageId` 查询文章详情  
- [ ] 实现 `POST /api/articles`  
  - [ ] 校验创作者/管理员权限  
  - [ ] 支持多语言设计（`originalId` 等）  
- [ ] 实现 `PATCH /api/articles/[id]`  
- [ ] 实现 `DELETE /api/articles/[id]`  
- [ ] 实现 `POST /api/articles/[id]/translate`  
  - [ ] 先完成数据层复制/创建目标语言记录，后续接入真实翻译服务  

#### 3.2 前台文章页面（P0）

- [ ] 完成首页 `app/pages/[lang]/index.vue`  
  - [ ] 调用 `GET /api/articles` 并使用 `ArticleList` / `ArticleCard` 渲染列表  
- [ ] 完成文章详情页 `app/pages/[lang]/post/[slug].vue`  
  - [ ] 调用 `GET /api/articles/[slug]` 渲染正文  
  - [ ] 预留评论与点赞区域  
- [ ] 创建分类/标签页面（简版）  
  - [ ] `app/pages/[lang]/category/[slug].vue`  
  - [ ] `app/pages/[lang]/tag/[slug].vue`  

#### 3.3 后台基础框架（P0）

- [ ] 实现后台布局 `layouts/admin.vue`  
  - [ ] 左侧菜单：文章、分类、标签、媒体、设置、翻译  
  - [ ] 右侧内容区域  
- [ ] 完成后台首页 `pages/admin/index.vue`  
  - [ ] 至少展示简单统计或欢迎页  
- [ ] 为后台路由添加权限中间件  
  - [ ] 未登录跳转登录页  
  - [ ] 权限不足跳转到无权限提示页  

---

### 4. 第四阶段：编辑器、媒体与分类标签（P1）

#### 4.1 Markdown 编辑器集成

- [ ] 安装 `@bytemd/vue-next` 并配置到项目依赖  
- [ ] 创建 `app/components/editor/MarkdownEditor.vue`  
  - [ ] 封装编辑器组件，对外暴露 `v-model` 接口  
- [ ] 在后台文章编辑页面中接入 `MarkdownEditor`  
  - [ ] 将编辑内容保存到文章 `content` 字段  

#### 4.2 媒体上传与管理

- [ ] 实现媒体 API  
  - [ ] `POST /api/media/upload` 使用 `server/utils/r2.ts` 上传文件到 R2  
  - [ ] `GET /api/media` 返回媒体列表  
  - [ ] `DELETE /api/media/[id]` 删除媒体记录与远端文件  
- [ ] 实现后台媒体管理界面 `pages/admin/media/index.vue`  
  - [ ] 展示媒体列表与删除功能  
  - [ ] 提供文件上传入口  

#### 4.3 分类与标签管理

- [ ] 实现分类 API（参考开发方案 2.4.3）  
- [ ] 实现标签 API（参考开发方案 2.4.3）  
- [ ] 在后台实现分类管理页 `admin/categories` 与标签管理页 `admin/tags`  
  - [ ] 列表、新增、编辑、删除  
- [ ] 在文章编辑页面中支持选择分类和标签  

---

### 5. 第五阶段：交互功能（评论、点赞、主题）（P1）

#### 5.1 评论系统

- [ ] 实现评论 API（参考开发方案 2.4.5）  
  - [ ] 获取、创建、审核、删除评论接口  
- [ ] 创建前端评论组件 `ArticleComments.vue`  
  - [ ] 在文章详情页接入评论展示与发表评论表单  
- [ ] 创建后台评论审核页面（可集成在 `admin/articles` 或单独模块）  

#### 5.2 点赞功能

- [ ] 实现点赞 API（参考开发方案 2.4.6）  
  - [ ] 使用 `ArticleLike` 表记录点赞  
  - [ ] 支持登录用户与 IP 双重唯一约束  
- [ ] 在文章详情页实现点赞按钮  
  - [ ] 显示当前点赞数  
  - [ ] 防止重复点赞/频繁刷赞  

#### 5.3 主题切换

- [ ] 在 `app/stores/theme.ts` 中实现主题 Store  
  - [ ] `theme = 'light' | 'dark' | 'system'`  
  - [ ] 支持 `localStorage` 持久化与系统主题同步  
- [ ] 在 `ThemeToggle.vue` 中调用主题 Store 实现切换  
- [ ] 在 `app.vue` 或布局中根据 Store 给 `html/body` 添加 `dark` 类  
  - [ ] 确保 Tailwind `darkMode: 'class'` 已开启  

---

### 6. 第六阶段：翻译、SEO 与高级功能（P2）

#### 6.1 自动翻译与翻译配置

- [ ] 实现翻译配置 API（参考开发方案 2.4.7）  
  - [ ] `GET /api/settings/translation`  
  - [ ] `PUT /api/settings/translation`  
- [ ] 在 `server` 中实现翻译服务封装（如 `utils/translate.ts`）  
- [ ] 在 `POST /api/articles/[id]/translate` 中接入真实翻译服务  
- [ ] 在后台 `admin/translation` 页面中提供：  
  - [ ] 翻译渠道与 API Key 配置  
  - [ ] 对文章/分类进行批量或单条翻译的入口  

#### 6.2 SEO 与分享

- [ ] 在 `useSEO.ts` 中封装 `useSeoMeta` / `useHead`  
- [ ] 为首页、文章详情页、分类页等关键页面添加 SEO 配置  
- [ ] 在 `ShareButtons.vue` 中实现社交分享（微信、微博、Twitter、Facebook 等）  

#### 6.3 初始化向导与高级设置

- [ ] 实现初始化向导页面  
  - [ ] `pages/init/index.vue`  
  - [ ] `pages/init/language.vue`  
  - [ ] `pages/init/admin.vue`  
  - [ ] `pages/init/complete.vue`  
- [ ] 在后台设置页中加入高级设置  
  - [ ] 支持配置 `customHead`、`customCSS`、`customJS`  
  - [ ] 在 Nuxt 应用中正确注入这些设置  

---


