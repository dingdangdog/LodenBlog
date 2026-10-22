<p align="center">
  <a href="./README.md"><strong>English</strong></a>
  &nbsp;·&nbsp;
  <a href="./README.zh-CN.md">中文</a>
</p>

<div align="center">
  <h1>LodenBlog</h1>
  <p>An open-source multilingual blog for a personal site or a small writing team.</p>
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

Publish Chinese, English, Japanese, German, and Spanish from one install, and add more content languages in the admin. The same article stays linked across languages. AI writing, machine translation, themes, and SEO are built in, and the site still runs if you leave them unset.

## Live sites

- [LodenHu](https://www.lodenhu.com)
- [月上老狗](https://www.oldmoon.top)

## Features

- **Multilingual content.** Articles, categories, tags, info pages, and columns each keep per-language fields. Public URLs use a language prefix, and the first visit can follow the browser language.
- **Linked translations.** Language versions of one article point at each other. Readers switch language instead of opening an unrelated copy.
- **AI writing and translation.** Draft with a model in the admin, then translate an article into the other languages. Provider keys are saved in admin settings. Writing, comments, and browsing keep working when AI is not configured.
- **Providers.** Models: OpenAI-compatible APIs, Gemini, DeepSeek, Alibaba Cloud (DashScope). Machine translation: DeepL, Google, Baidu, Tencent, Youdao, Volcano Engine. Any other OpenAI-compatible endpoint can be added as an OpenAI provider.
- **Columns and paid reading.** An article is free, part of a column, or paid on its own. Readers without access see only the free section. Access is granted with redeem codes: column subscriptions last a set number of days, and a single article stays unlocked. Online checkout is not included.
- **Admin.** Posts, categories, tags, media, comment review, users, creator applications, visit stats, and translation logs.
- **Theme and brand.** Light and dark mode, theme colors, logo and favicon, plus custom CSS, JS, and head markup.
- **Accounts.** Email and password, with optional GitHub and Google login. Roles are reader, creator, and admin.
- **SEO.** Site metadata, sitemap, robots, Google Analytics, Google AdSense, friend links, and info pages.
- **Media.** Uploads go to Cloudflare R2. A custom public domain can be bound to the bucket.

Interface language and content language are separate. The interface ships with Chinese, English, Japanese, German, and Spanish. Content languages can be added or removed in the admin.

## Deploy

Production uses Docker and listens on port **7061**. Server prep, callback URLs, and vendor console links are in [DEPLOY.md](DEPLOY.md) (Chinese).

1. **Server.** A public Linux host with [Docker](https://docs.docker.com/engine/install/) and Compose. Open `7061`, or put Nginx, Caddy, or Cloudflare in front of HTTPS.
2. **PostgreSQL.** Self-hosted or managed. Set `DATABASE_URL`. On startup the container applies `prisma/migrations`. Set `DATABASE_AUTO_MIGRATE=false` to apply them yourself.
3. **Domain and R2.** Point the domain at the server. Hosting the DNS on [Cloudflare](https://dash.cloudflare.com/) makes a custom R2 domain easier. Image upload needs an R2 bucket. Those values are entered in the setup wizard, not in `.env`.
4. **Optional accounts.**

   | Use | Required | Console |
   | --- | --- | --- |
   | Image upload | Yes | [Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2/overview) |
   | GitHub login | No | [Create a GitHub OAuth App](https://github.com/settings/applications/new) |
   | Google login | No | [Google Auth clients](https://console.cloud.google.com/auth/clients) |
   | AI / translation | No | [DEPLOY.md §8](DEPLOY.md#8-ai-与机器翻译可选) |
   | Analytics / ads | No | [Google Analytics](https://analytics.google.com/) · [AdSense](https://www.google.com/adsense/) |

5. **Environment and start.** Copy `.env.example` to `.env`. At minimum set `DATABASE_URL`, `NUXT_AUTH_SECRET`, `NUXT_SALT`, and `NUXT_AUTH_BASE_URL` (for example `https://your-domain/api/auth`). The same variables can be edited in `docker-compose.yml`.

   ```bash
   docker compose up -d
   ```

   Image: [`dingdangdog/loden`](https://hub.docker.com/r/dingdangdog/loden).

6. **Setup wizard.** The first visit opens the wizard for the primary language, SEO, R2, and the admin account. GitHub and Google login switches, and translation providers, are turned on later in the admin.

## Local development

Use Node.js 22 and the pnpm version in `package.json` (`packageManager`). PostgreSQL must already be reachable.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

The dev server listens on port `7061`. When the schema changes, generate the Prisma migration yourself. Do not commit hand-written migration SQL.

## Docs

Detailed docs are in Chinese.

- [Deploy guide](DEPLOY.md): server, database, R2, OAuth, and AI keys
- [Quick start](docs/quick-start.md)
- [Features](docs/features.md)
- [Architecture](docs/ARCHITECTURE.md)

## License

[MIT](LICENSE)
