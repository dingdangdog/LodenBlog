# 202609092250 - Docker 部署后自动同步 Prisma schema

**日期：** 2026-09-09

## 背景 / 问题

Docker 镜像构建后、容器启动时不会自动把 `prisma/migrations` 应用到 PostgreSQL。部署文档要求运维在能连库的环境里手动执行 `npx prisma migrate deploy`，容易漏做，导致表不存在或结构落后。目标是对齐 jimily：构建期不连库，进程启动后由应用内迁移运行器同步 schema。

## 变更内容

- 新增 `server/lib/db-migrations.ts`：读取镜像内 `prisma/migrations`，维护 `_prisma_migrations`，空库建库并顺序执行 SQL；已有完整结构但无迁移历史时 baseline；checksum 兼容 LF/CRLF。
- `server/plugins/init-db.ts` 在任何 Prisma 查询之前 `await ensureDatabaseMigrations()`；预渲染阶段跳过。
- 生产依赖增加 `pg`；Dockerfile 仍 COPY 整个 `prisma/`（含 migrations）；Compose / `.env.example` 增加 `DATABASE_AUTO_MIGRATE`、`DATABASE_BOOTSTRAP_URL`、`DATABASE_SCHEMA`。
- 更新 `DEPLOY.md`、`README.md`、`docs/database-init.md`：默认容器启动即同步，可用 `DATABASE_AUTO_MIGRATE=false` 改回外部迁移。

## 影响范围

- `server/lib/db-migrations.ts`
- `server/plugins/init-db.ts`
- `package.json` / `pnpm-lock.yaml`
- `Dockerfile`
- `docker-compose.yml`
- `.env.example`
- `DEPLOY.md` / `README.md` / `docs/database-init.md`

## 数据库与兼容性

- 无 schema 变化，**不生成** Prisma migration。
- 运行时行为变化：默认启动即应用已有 `prisma/migrations`。已用 Prisma CLI 迁过的库只会补未记录项；结构未对齐且无迁移历史的旧库会拒绝 baseline，需人工对齐。
- 设 `DATABASE_AUTO_MIGRATE=false` 可关闭自动同步。

## 验证

- `pnpm install --ignore-scripts`：通过；`pg@8.16.3` 已写入 `package.json` 与 `pnpm-lock.yaml`（耗时约 5m 45s）。
- 修改文件的 IDE lint：无新问题。
- 未启动开发服务或 Docker 容器（按约束）。
- 容器启动、空库建表、存量库补迁移、checksum / baseline 拒绝：待人工用真实 PostgreSQL 验证。

## 未做事项

- 未把 Prisma CLI 打进运行镜像，也未改用 `entrypoint.sh` + `npx prisma migrate deploy`。
- 改表时仍需开发者自行 `prisma migrate dev` 生成脚本。
