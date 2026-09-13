# 202609081330 - 重写 README 与部署文档

**日期：** 2026-09-08

## 背景 / 问题

原 README 几乎只有安装命令，没有说明产品能力。DEPLOY 列出了第三方准备项，但缺少控制台快捷链接、回调地址示例，以及 OAuth 密钥与后台开关的真实分工。

## 变更内容

- 重写 `README.md`：补充功能、特点、优势，并加入从准备到初始化向导的部署流程摘要，第三方准备用表格链到控制台。
- 重写 `DEPLOY.md`：按步骤展开 Docker 部署；GitHub / Google / R2 / AI 翻译 / Analytics 均给出官方入口、应填字段和回调 URL；纠正 Client ID/Secret 仅来自环境变量、登录开关在后台系统配置的说明；明确 Prisma 迁移需开发者自行执行。

## 影响范围

- `README.md`
- `DEPLOY.md`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 不改变运行时行为或环境变量名。

## 验证

- 对照 `.env.example`、`docker-compose.yml`、`server/api/auth/[...].ts`、`server/utils/config-keys.ts`、初始化向导步骤与翻译协议选项核对文档表述。
- 服务启动、第三方控制台实操、Docker 部署：未测试（本次仅为文档，且按约束不启动服务）。

## 未做事项

- 未改 `docs/quick-start.md`、`docs/features.md` 中仍偏旧的仓库名与 OAuth 说明。
- 未在 Docker 镜像内自动执行 `prisma migrate deploy`。
