# 202609091720 - 修复 Docker 构建时 Corepack 找不到 pnpm

**日期：** 2026-09-09

## 背景 / 问题

`docker build` 在 `pnpm install` 阶段失败。Node 22.21.1 自带 Corepack 会默认下载 pnpm 12.3.4，而 pnpm 12 是原生二进制；Corepack 不执行安装脚本，仍查找 `bin/pnpm.cjs`，报 `MODULE_NOT_FOUND`。

## 变更内容

- `package.json` 固定 `packageManager` 为 `pnpm@10.33.0`，与本地 lockfile（v9 / pnpm 10）一致。
- Dockerfile builder 不再 `corepack enable`，改为从 npmmirror 全局安装 `pnpm@10.33.0`。

## 影响范围

- `Dockerfile`
- `package.json`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 本地仍使用 pnpm 10；未升级 lockfile 到 pnpm 12。

## 验证

- 同基础镜像 `npm install -g pnpm@10.33.0` 后 `pnpm -v`：输出 `10.33.0`。
- `docker build -t loden-test:fix-corepack .`：通过；`pnpm install` 使用 pnpm v10.33.0 完成，镜像导出成功。
- 未启动容器或开发服务。
