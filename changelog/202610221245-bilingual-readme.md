# 202610221245 - README 拆成英文默认与中文版

**日期：** 2026-10-22

## 背景 / 问题

仓库只有一份中文 `README.md`。GitHub 默认页因此不是英文，也没有互相跳转的语言版本。原文徽标指向不存在的 `logo.webp`，Docker 拉取数徽章用了错误镜像名 `dingdangdog/lodenblog`，部署步骤有重复用词，且未写专栏与付费阅读。

## 变更内容

- `README.md` 改为英文，作为默认说明。
- 原介绍迁到 `README.zh-CN.md`，两份在页首互链。
- 修正 Docker 徽章与镜像链接为 `dingdangdog/loden`，去掉失效 Logo，补上专栏兑换阅读和本地开发入口。
- `DEPLOY.md` 的摘要链接改为同时指向中文与英文 README。

## 影响范围

- `README.md`
- `README.zh-CN.md`
- `DEPLOY.md`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 不改变运行时行为或环境变量名。

## 验证

- 对照 `docker-compose.yml`、`.env.example`、`DEPLOY.md`、`nuxt.config.ts` 语言列表、翻译客户端和专栏访问说明核对表述。
- 确认 `DEPLOY.md`、`docs/quick-start.md`、`docs/features.md`、`docs/ARCHITECTURE.md`、`LICENSE` 链接目标存在。
- 未启动服务，未在 GitHub 上渲染 README。

## 未做事项

- 未改 `docs/quick-start.md`、`docs/features.md` 里仍偏旧的安装说明。
