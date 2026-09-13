# Loden 部署教程

生产环境推荐 **Docker**。按下面顺序准备服务器、数据库和第三方账号，再启动容器。首次打开站点会进入系统初始化向导。

更短的功能介绍与流程摘要见 [README.md](README.md)。

---

## 部署总览

| 步骤 | 内容 | 必需 | 快捷入口 |
| --- | --- | --- | --- |
| 1 | 服务器 | 必需 | — |
| 2 | Docker | 必需 | [安装 Docker](https://docs.docker.com/engine/install/) |
| 3 | 域名 | 建议 | [Cloudflare Dashboard](https://dash.cloudflare.com/) |
| 4 | PostgreSQL | 必需 | [PostgreSQL 下载](https://www.postgresql.org/download/) · [官方镜像](https://hub.docker.com/_/postgres) |
| 5 | GitHub 登录 | 可选 | [创建 OAuth App](https://github.com/settings/applications/new) |
| 6 | Google 登录 | 可选 | [OAuth 客户端](https://console.cloud.google.com/auth/clients) |
| 7 | Cloudflare R2 | 必需（图片上传） | [R2 概览](https://dash.cloudflare.com/?to=/:account/r2/overview) |
| 8 | AI / 机器翻译 | 可选 | 见 [第 8 节](#8-ai-与机器翻译可选) |
| 9 | Analytics / AdSense | 可选 | [Analytics](https://analytics.google.com/) · [AdSense](https://www.google.com/adsense/) |

完成后：复制 `.env.example` 为 `.env` → `docker compose up -d` → 打开站点完成初始化。容器启动时会自动把 `prisma/migrations` 应用到数据库。

公开镜像：[`dingdangdog/loden`](https://hub.docker.com/r/dingdangdog/loden)，默认监听 **7061**。

---

## 1. 服务器准备

准备一台可公网访问的 Linux 服务器，能安装 Docker，并开放应用端口（默认 **7061**）。生产环境建议用 Nginx、Caddy 或 Cloudflare 反代到 443，并启用 HTTPS。

---

## 2. Docker 准备（必需）

在服务器上安装 Docker Engine 与 Docker Compose：

- [Docker Engine 安装文档](https://docs.docker.com/engine/install/)
- [Docker Compose 概览](https://docs.docker.com/compose/)

确认：

```bash
docker --version
docker compose version
```

本仓库的 `docker-compose.yml` 会拉取或构建 `dingdangdog/loden:latest`，把 `.env` 注入容器，并把 `./resources` 挂到 `/app/resources`。

---

## 3. 域名准备（建议）

准备一个域名并完成解析。

**建议将域名托管到 Cloudflare**，后续给 R2 绑定自定义访问域名更方便。

- [Cloudflare 控制台](https://dash.cloudflare.com/)
- [添加站点](https://dash.cloudflare.com/?to=/:account/add-site)

若暂不使用 Cloudflare，R2 仍可使用 Cloudflare 提供的默认公共域名。

把站点根地址记下来，后面环境变量和 OAuth 回调都要用，例如 `https://blog.example.com`。

---

## 4. PostgreSQL 数据库准备（必需）

准备 PostgreSQL 实例（自建、云数据库或 Docker 均可）。创建空库后，在 `.env` 中填写：

```text
DATABASE_URL=postgresql://用户:密码@主机:端口/数据库名?schema=public
```

### 迁移（容器启动时自动执行）

镜像构建阶段**不连接数据库、不跑 migration**。容器进程拉起后，Nitro 启动插件会读取镜像内 `prisma/migrations`，写入与 Prisma 兼容的 `_prisma_migrations` 表：

- 空库：按目录名顺序执行未应用的 `migration.sql`（库不存在时会尝试 `CREATE DATABASE`）
- 已用 Prisma CLI 迁过的库：只补尚未记录的迁移
- 已有业务表但无迁移历史、且结构已对齐当前 schema：只写入迁移记录（baseline），不重复执行 SQL
- 设 `DATABASE_AUTO_MIGRATE=false` 时跳过，改由你在能连上该库的环境执行 `npx prisma migrate deploy`

需要改表时，仍由开发者在本地用 Prisma 命令自行生成脚本，不要提交手写 migration SQL。

可选环境变量：

| 变量 | 说明 |
| --- | --- |
| `DATABASE_AUTO_MIGRATE` | 设为 `false` 时跳过自动同步 |
| `DATABASE_BOOTSTRAP_URL` | 用于 `CREATE DATABASE` 的管理连接；缺省把 `DATABASE_URL` 的库名改为 `postgres` |
| `DATABASE_SCHEMA` | URL 未带 `schema` 参数时使用，默认 `public` |

---

## 5. GitHub 登录（可选）

仅在需要「使用 GitHub 登录 / 注册」时配置。Client ID / Secret **只能写在环境变量**里；后台「系统配置」里的开关只控制是否显示该登录按钮。

### 快捷入口

- [创建 GitHub OAuth App](https://github.com/settings/applications/new)
- [已有 OAuth App 列表](https://github.com/settings/developers)
- [GitHub OAuth 文档](https://docs.github.com/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

### 填写内容

以生产站点 `https://你的域名` 为例：

| 字段 | 值 |
| --- | --- |
| Application name | 任意，如 `Loden` |
| Homepage URL | `https://你的域名` |
| Authorization callback URL | `https://你的域名/api/auth/callback/github` |

本地开发把上面两处换成 `http://localhost:7061` 与 `http://localhost:7061/api/auth/callback/github`。

创建后复制 Client ID、Client Secret，写入 `.env`：

```text
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

启动后，在管理后台 **设置 → 系统配置** 打开 `GITHUB_LOGIN_ENABLED`。修改环境变量后需要重启容器。

---

## 6. Google 登录（可选）

仅在需要「使用 Google 登录 / 注册」时配置。同样：密钥走环境变量，后台开关只控制按钮显示。

### 快捷入口

1. [Google Cloud 控制台](https://console.cloud.google.com/)
2. [创建项目](https://console.cloud.google.com/projectcreate)（已有项目可跳过）
3. [Google Auth Platform（同意屏幕 / 品牌）](https://console.cloud.google.com/auth/overview)
4. [OAuth 客户端列表](https://console.cloud.google.com/auth/clients)
5. [凭据页（旧入口）](https://console.cloud.google.com/apis/credentials)
6. [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)

### 操作步骤

1. 打开 [创建项目](https://console.cloud.google.com/projectcreate)，或在控制台顶部选择已有项目。
2. 打开 [Auth Platform](https://console.cloud.google.com/auth/overview)，完成 OAuth 同意屏幕：
   - 用户类型一般选 **外部**（个人站点）。
   - 填写应用名称、支持邮箱、开发者联系邮箱。
   - 测试阶段把将要登录的 Google 账号加到测试用户。
3. 打开 [OAuth 客户端](https://console.cloud.google.com/auth/clients)，创建 **Web 应用**。
4. 填写来源与回调（把域名换成你的站点）：

   | 字段 | 值 |
   | --- | --- |
   | 应用类型 | Web application |
   | 已授权的 JavaScript 来源 | `https://你的域名` |
   | 已授权的重定向 URI | `https://你的域名/api/auth/callback/google` |

   本地开发：

   | 字段 | 值 |
   | --- | --- |
   | 已授权的 JavaScript 来源 | `http://localhost:7061` |
   | 已授权的重定向 URI | `http://localhost:7061/api/auth/callback/google` |

   同一客户端可以同时加生产和本地两条来源 / 回调。
5. 创建后复制客户端 ID、客户端密钥，写入 `.env`：

   ```text
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   ```

6. 启动后，在管理后台 **设置 → 系统配置** 打开 `GOOGLE_LOGIN_ENABLED`。修改环境变量后需要重启容器。

若登录报 `redirect_uri_mismatch`，先核对该客户端里的重定向 URI 是否与 `NUXT_AUTH_BASE_URL` 完全一致（含协议、域名、路径，不要多余斜杠）。

---

## 7. Cloudflare R2 准备（必需，用于图片上传）

Logo、图标、文章配图等都走 R2。可在首次初始化向导里填写，之后也可在后台 **设置 → 系统配置** 修改。

### 快捷入口

- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [R2 概览](https://dash.cloudflare.com/?to=/:account/r2/overview)
- [R2 API Token](https://dash.cloudflare.com/?to=/:account/r2/api-tokens)
- [R2 快速开始](https://developers.cloudflare.com/r2/get-started/)
- [S3 兼容 API Token](https://developers.cloudflare.com/r2/api/s3/tokens/)
- [公共访问与自定义域名](https://developers.cloudflare.com/r2/buckets/public-buckets/)

### 需要准备的值

| 配置项 | 说明 |
| --- | --- |
| R2 Endpoint URL | 形如 `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| Access Key ID | 必须是 **32 个字符** |
| Secret Access Key | 与 Access Key 成对 |
| Bucket 名称 | 你创建的存储桶名 |
| HTTP API Token | 可选 |
| 公共访问域名 | 建议绑定自定义域名，如 `https://cdn.你的域名` |

在 R2 中创建 Bucket，生成 **S3 兼容** 的 Access Key，并开启公共访问或绑定自定义域名。自定义域名建议用已托管在 Cloudflare 的域名。

这些值写入系统配置，**不是** `.env`。初始化向导或后台保存即可。

---

## 8. AI 与机器翻译（可选）

未配置时，写文章、评论、多语言浏览仍可用；AI 写文章、一键翻译、AI 生成主题等不可用。

密钥在管理后台 **设置 → 翻译配置** 中添加，不必写进 `.env`。可同时配置多个服务商，并指定默认项。

### 大模型（AI 写文章、长文翻译、主题生成等）

| 服务商 | 快捷入口 |
| --- | --- |
| OpenAI | [API Keys](https://platform.openai.com/api-keys) |
| Google Gemini | [Google AI Studio 密钥](https://aistudio.google.com/apikey) |
| DeepSeek | [API Keys](https://platform.deepseek.com/api_keys) |
| 阿里云（通义 / DashScope） | [DashScope 控制台](https://dashscope.console.aliyun.com/) |
| 其他 OpenAI 兼容接口 | 使用对应厂商的兼容 Endpoint 与 API Key |

### 机器翻译（短句、slug、分类名等）

| 服务商 | 快捷入口 |
| --- | --- |
| DeepL | [DeepL API](https://www.deepl.com/pro-api) |
| Google Cloud Translation | [启用 Translation API](https://console.cloud.google.com/apis/library/translate.googleapis.com) · [凭据](https://console.cloud.google.com/apis/credentials) |
| 百度翻译 | [百度翻译开放平台](https://fanyi-api.baidu.com/manage/developer) |
| 腾讯翻译 | [腾讯云机器翻译](https://console.cloud.tencent.com/tmt) · [API 密钥](https://console.cloud.tencent.com/cam/capi) |
| 有道智云 | [有道智云控制台](https://ai.youdao.com/console/) |
| 火山引擎 | [火山引擎机器翻译](https://console.volcengine.com/machine-translation) |

后台协议选项包括：OpenAI、Gemini、阿里云、DeepSeek、DeepL、火山、Google 翻译、百度、腾讯、有道。未单独适配的厂商，只要提供 OpenAI 兼容接口，也可按 OpenAI 协议填写。

---

## 9. Google Analytics / AdSense（可选）

在管理后台 **设置 → 系统配置** 中填写，不走 `.env`。

| 用途 | 快捷入口 |
| --- | --- |
| Google Analytics | [Google Analytics](https://analytics.google.com/) |
| Google AdSense | [AdSense](https://www.google.com/adsense/) |

在系统配置中打开对应开关，并填入 Analytics ID、AdSense Publisher ID、文内广告 Slot ID。

---

## 10. 环境变量与启动

复制模板：

```bash
cp .env.example .env
```

### 必需

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `NUXT_AUTH_SECRET` | Auth 密钥，使用长随机字符串 |
| `NUXT_SALT` | 密码盐，上线后不要更换，否则已有密码会失效 |
| `NUXT_AUTH_BASE_URL` | Auth 根地址，生产示例：`https://你的域名/api/auth` |

### 建议

| 变量 | 说明 |
| --- | --- |
| `NUXT_PUBLIC_SITE_URL` | 站点根 URL，如 `https://你的域名` |
| `PORT` | 默认 `7061`，Compose 已映射 |

### 可选（OAuth）

| 变量 | 说明 |
| --- | --- |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub 登录 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google 登录 |
| `NUXT_TOKEN_SECRET` | 可留空 |

不要把真实密钥提交到 Git。不要读取或分享已填写的 `.env`。

启动：

```bash
docker compose up -d
```

本地构建而不是拉镜像：

```bash
docker compose build
docker compose up -d
```

---

## 11. 首次初始化向导

容器起来后访问站点根地址。未初始化时会进入 `/setup`，顺序为：

1. 选择主语言和要启用的界面语言
2. 填写站点标题、描述、关键词、域名
3. 填写 Cloudflare R2
4. 可选上传 Logo / Favicon
5. 创建管理员账号
6. 确认并完成

完成后使用该管理员登录。GitHub / Google 登录开关、翻译服务商、Analytics / AdSense 在后台设置里继续配置。

---

## 12. 发布镜像（维护者）

推送符合 `vMAJOR.MINOR.PATCH` 的 git tag 后，GitHub Actions 会构建 `linux/amd64` 与 `linux/arm64` 镜像，推送到 Docker Hub，并创建 GitHub Release：

```bash
git tag v1.7.6
git push origin v1.7.6
```

- 镜像仓库：[Docker Hub `dingdangdog/loden`](https://hub.docker.com/r/dingdangdog/loden)
- 工作流：仓库 Settings → [Environments](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)，需要 Environment `docker_hub`
- Secrets：`DOCKER_USERNAME`、`DOCKER_PASSWORD`（可在 [Docker Hub 访问令牌](https://hub.docker.com/settings/security) 创建）

---

## 常见问题

### 容器立刻退出

检查是否缺少 `NUXT_AUTH_SECRET`、`NUXT_SALT` 或 `DATABASE_URL`。未设置时进程会直接失败。schema 同步失败时日志前缀为 `[db:migrate]`（例如 checksum mismatch、baseline 拒绝）。

### 数据库报错 / 表不存在

确认 `DATABASE_URL` 可从容器访问（注意 `localhost` 在容器内指向容器自己）。启动日志里应先出现 `🔧 开始检查 Prisma 数据库同步...`，再出现 `[db:migrate] checking …`，最后是 `schema is up to date` 或 `applied …` / `done: applied …`，以及 `✅ Prisma 数据库同步检查完成`。若设了 `DATABASE_AUTO_MIGRATE=false`，会看到 `skipped`。

### OAuth 按钮不出现

环境变量已配置且容器已重启后，还需要在后台打开 `GITHUB_LOGIN_ENABLED` / `GOOGLE_LOGIN_ENABLED`。

### Google 提示 redirect_uri_mismatch

在 [OAuth 客户端](https://console.cloud.google.com/auth/clients) 中核对重定向 URI，必须等于 `{NUXT_AUTH_BASE_URL}/callback/google`。

### 图片上传失败

检查 R2 Endpoint、32 位 Access Key ID、Bucket 名和公共域名；Access Key 必须是 S3 兼容凭证，见 [R2 API Token](https://dash.cloudflare.com/?to=/:account/r2/api-tokens)。
