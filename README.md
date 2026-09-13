<div align="center" style="display:flex;align-items:center;justify-content:center;">
<img src="/public/logo.webp" width="80px" alt="cashbook" />
<h1 style="margin-left:1rem;">LodenBlog</h1>
</div>

<p align="center">
  <img alt="release" src="https://img.shields.io/github/v/release/dingdangdog/lodenblog" />
  <img alt="stars" src="https://img.shields.io/github/stars/dingdangdog/lodenblog" />
  <img alt="dorks" src="https://img.shields.io/github/forks/dingdangdog/lodenblog" />
</p>
<p align="center">
  <img alt="issues-open" src="https://img.shields.io/github/issues/dingdangdog/lodenblog?color=important" />
  <img alt="issues-close" src="https://img.shields.io/github/issues-closed/dingdangdog/lodenblog?color=green" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-yellow.svg" />
  <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/dingdangdog/lodenblog.svg" />
</p>

LodenBlog 是一个开源的多语言个人博客。用一套系统同时管理中文、英文、日文、德语、西班牙语等内容，内置 AI 写作、多服务商翻译、主题与 SEO，适合个人站点与小型创作团队。

## 案例
- [LodenHu](https://www.lodenhu.com)
- [月上老狗](https://www.oldmoon.top)

## 功能

- **多语言内容**：文章、分类、标签、信息页均可按语言维护；前台按语言前缀访问，并支持浏览器语言检测。
- **AI 写作与翻译**：后台可用大模型写文章；文章可一键翻译到多种语言。
- **多服务商接入**：大模型支持 OpenAI 兼容接口、Gemini、DeepSeek、阿里云等；机器翻译支持 DeepL、Google、百度、腾讯、有道、火山等。
- **完整创作后台**：文章、分类、标签、媒体、评论审核、用户与创作者申请、访问统计、翻译日志。
- **主题与品牌**：明暗模式、多套主题色，以及 Logo / Favicon、自定义 CSS / JS / Head。
- **账号与权限**：邮箱密码登录，可选 GitHub / Google 登录；角色分为普通用户、创作者、管理员。
- **SEO 与变现**：独立站点信息、sitemap、robots、Google Analytics、Google AdSense、友情链接、信息页。
- **媒体存储**：图片等文件上传到 Cloudflare R2，可绑定自定义访问域名。

## 特点

- 首次访问进入初始化向导，创建管理员、站点 SEO、R2 与语言，不必先改数据库。
- 内容语言与界面语言分开：站点界面内置中/英/日/德/西，内容语言可在后台继续增删。
- 同一篇文章的多语言版本互相关联，读者可在语言间切换而不是看到孤立副本。
- 翻译与 AI 在后台配置密钥即可使用，未配置时其余功能仍可独立运行。
- 使用 Docker 镜像即可部署，默认端口 `7061`，也可用 Nginx 等反代到 443。

## 部署流程

生产环境推荐 Docker。完整准备项、回调地址和第三方控制台链接见 [DEPLOY.md](DEPLOY.md)。

1. **准备服务器与 Docker**  
   一台可公网访问的 Linux 主机，安装 [Docker](https://docs.docker.com/engine/install/) 与 Compose，开放 `7061` 或交给 Nginx / Caddy 反代。

2. **准备 PostgreSQL**  
   自建或云数据库均可，记下 `DATABASE_URL`。容器启动后会自动应用 `prisma/migrations`（不要提交手写 migration）。若要改由外部迁移，设 `DATABASE_AUTO_MIGRATE=false`。

3. **准备域名（建议）**  
   解析到服务器。建议托管到 [Cloudflare](https://dash.cloudflare.com/)，方便给 R2 绑自定义域名。

4. **准备第三方账号（按需）**

   | 用途        | 是否必需 | 快捷入口                                                                                       |
   | ----------- | -------- | ---------------------------------------------------------------------------------------------- |
   | 图片上传    | 必需     | [Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2/overview)                         |
   | GitHub 登录 | 可选     | [创建 GitHub OAuth App](https://github.com/settings/applications/new)                          |
   | Google 登录 | 可选     | [Google Auth 客户端](https://console.cloud.google.com/auth/clients)                            |
   | AI / 翻译   | 可选     | 见 [DEPLOY.md](DEPLOY.md#8-ai-与机器翻译可选)                                                  |
   | 统计 / 广告 | 可选     | [Google Analytics](https://analytics.google.com/) · [AdSense](https://www.google.com/adsense/) |

5. **填写环境变量并启动**

   ```bash
   git clone https://github.com/dingdangdog/LodenBlog.git
   cd LodenBlog
   cp .env.example .env
   ```

   至少设置 `DATABASE_URL`、`NUXT_AUTH_SECRET`、`NUXT_SALT`、`NUXT_AUTH_BASE_URL`（形如 `https://你的域名/api/auth`）。然后：

   ```bash
   docker compose up -d
   ```

6. **完成初始化向导**  
   打开站点，按向导填写主语言、SEO、R2、管理员账号。之后可在后台打开 GitHub / Google 登录开关，并配置翻译服务商。

## 文档

- [部署教程](DEPLOY.md)：服务器、数据库、R2、OAuth、AI 密钥与启动步骤
- [快速开始](docs/quick-start.md)
- [功能说明](docs/features.md)
- [架构说明](docs/ARCHITECTURE.md)

## 许可证

[MIT](LICENSE)
