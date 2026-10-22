<p align="center">
  <a href="./README.md">English</a>
  &nbsp;·&nbsp;
  <a href="./README.zh-CN.md"><strong>中文</strong></a>
</p>

<div align="center">
  <h1>LodenBlog</h1>
  <p>开源的多语言个人博客，适合个人站点与小型创作团队。</p>
</div>

<p align="center">
  <img alt="release" src="https://img.shields.io/github/v/release/dingdangdog/lodenblog" />
  <img alt="stars" src="https://img.shields.io/github/stars/dingdangdog/lodenblog" />
  <img alt="forks" src="https://img.shields.io/github/forks/dingdangdog/lodenblog" />
</p>
<p align="center">
  <img alt="issues-open" src="https://img.shields.io/github/issues/dingdangdog/lodenblog?color=important" />
  <img alt="issues-closed" src="https://img.shields.io/github/issues-closed/dingdangdog/lodenblog?color=green" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-yellow.svg" />
  <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/dingdangdog/loden.svg" />
</p>

用一套系统同时管理中文、英文、日文、德语、西班牙语内容，也可以在后台继续增删内容语言。同一篇文章的各语言版本互相关联。内置 AI 写作、多服务商翻译、主题与 SEO；未配置这些能力时，其余功能仍可独立运行。

## 案例

- [LodenHu](https://www.lodenhu.com)
- [月上老狗](https://www.oldmoon.top)

## 功能

- **多语言内容**：文章、分类、标签、信息页、专栏均可按语言维护。前台按语言前缀访问，并支持浏览器语言检测。
- **互相关联的译文**：同一篇文章的多语言版本互相指向，读者切换语言时不会落到孤立副本。
- **AI 写作与翻译**：后台可用大模型写文章，再一键翻译到其他语言。密钥保存在后台配置中；未配置时，写作、评论和浏览仍可用。
- **多服务商接入**：大模型支持 OpenAI 兼容接口、Gemini、DeepSeek、阿里云（DashScope）。机器翻译支持 DeepL、Google、百度、腾讯、有道、火山引擎。其他厂商只要提供 OpenAI 兼容接口，可按 OpenAI 协议填写。
- **专栏与付费阅读**：文章可以是免费、专栏或单篇付费。未开通的读者只看到免费段。目前用兑换码开通：专栏按天数订阅，单篇永久解锁。不包含在线收银台。
- **创作后台**：文章、分类、标签、媒体、评论审核、用户与创作者申请、访问统计、翻译日志。
- **主题与品牌**：明暗模式、多套主题色，以及 Logo、Favicon、自定义 CSS / JS / Head。
- **账号与权限**：邮箱密码登录，可选 GitHub / Google 登录。角色分为普通用户、创作者、管理员。
- **SEO**：独立站点信息、sitemap、robots、Google Analytics、Google AdSense、友情链接、信息页。
- **媒体存储**：图片等文件上传到 Cloudflare R2，可绑定自定义访问域名。

界面语言与内容语言分开。界面内置中文、英文、日文、德文、西班牙文；内容语言可在后台增删。

## 部署

生产环境推荐 Docker，默认端口 **7061**。服务器准备、回调地址和第三方控制台链接见 [DEPLOY.md](DEPLOY.md)。

1. **准备服务器与 Docker**  
   一台可公网访问的 Linux 主机，安装 [Docker](https://docs.docker.com/engine/install/) 与 Compose。开放 `7061`，或用 Nginx、Caddy、Cloudflare 反代到 HTTPS。

2. **准备 PostgreSQL**  
   自建或云数据库均可，记下 `DATABASE_URL`。容器启动后会自动应用 `prisma/migrations`。若要改由外部迁移，设 `DATABASE_AUTO_MIGRATE=false`。

3. **准备域名和 R2**  
   把域名解析到服务器。建议托管到 [Cloudflare](https://dash.cloudflare.com/)，方便给 R2 绑自定义域名。图片上传需要 R2 存储桶，相关值在初始化向导填写，不写入 `.env`。

4. **准备第三方账号（按需）**

   | 用途 | 是否必需 | 快捷入口 |
   | --- | --- | --- |
   | 图片上传 | 必需 | [Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2/overview) |
   | GitHub 登录 | 可选 | [创建 GitHub OAuth App](https://github.com/settings/applications/new) |
   | Google 登录 | 可选 | [Google Auth 客户端](https://console.cloud.google.com/auth/clients) |
   | AI / 翻译 | 可选 | [DEPLOY.md 第 8 节](DEPLOY.md#8-ai-与机器翻译可选) |
   | 统计 / 广告 | 可选 | [Google Analytics](https://analytics.google.com/) · [AdSense](https://www.google.com/adsense/) |

5. **填写环境变量并启动**  
   复制 `.env.example` 为 `.env`。至少设置 `DATABASE_URL`、`NUXT_AUTH_SECRET`、`NUXT_SALT`、`NUXT_AUTH_BASE_URL`（形如 `https://你的域名/api/auth`）。也可以直接改 `docker-compose.yml` 里的同名变量。

   ```bash
   docker compose up -d
   ```

   公开镜像：[`dingdangdog/loden`](https://hub.docker.com/r/dingdangdog/loden)。

6. **完成初始化向导**  
   打开站点，按向导填写主语言、SEO、R2 和管理员账号。之后可在后台打开 GitHub / Google 登录开关，并配置翻译服务商。

## 本地开发

使用 Node.js 22，以及 `package.json` 里 `packageManager` 指定的 pnpm。PostgreSQL 需要事先可连接。

```bash
cp .env.example .env
pnpm install
pnpm dev
```

开发服务监听 `7061`。需要改表时由开发者自行用 Prisma 生成 migration，不要提交手写 migration SQL。

## 文档

- [部署教程](DEPLOY.md)：服务器、数据库、R2、OAuth、AI 密钥与启动步骤
- [快速开始](docs/quick-start.md)
- [功能说明](docs/features.md)
- [架构说明](docs/ARCHITECTURE.md)

## 许可证

[MIT](LICENSE)
