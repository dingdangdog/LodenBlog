# 202609092325 - 启动时输出 Prisma 同步检查日志

**日期：** 2026-09-09

## 背景 / 问题

库已是最新时，自动同步几乎不打日志，启动后看不出是否做过 schema 检查。

## 变更内容

- `init-db` 在同步前后输出「开始检查 / 检查完成」。
- `db-migrations` 每次启动都输出检查路径与文件数；已是最新时输出 `schema is up to date`，有新迁移时输出 `applied` 与汇总。

## 影响范围

- `server/plugins/init-db.ts`
- `server/lib/db-migrations.ts`
- `DEPLOY.md`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。仅增加启动日志。

## 验证

- 对照启动插件与迁移运行器的日志分支：跳过、无文件、已最新、新应用均有输出。
- 服务启动 / Docker：未测试（按约束不启动服务）。
