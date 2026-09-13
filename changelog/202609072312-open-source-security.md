# 202609072312 - 开源安全整改与 Docker 自动发布

**日期：** 2026-09-07

## 背景 / 问题

仓库从闭源个人站点转向开源。源码、Dockerfile 与 Compose 中存在弱密钥、个人域名和 AdSense 示例 ID，且缺少 LICENSE、环境变量模板与自动发镜像工作流。

## 变更内容

- 去掉 Auth / 密码盐 / Docker 镜像中的弱默认密钥；未设置 `NUXT_AUTH_SECRET`、`NUXT_SALT` 时运行时启动失败。
- 删除启动时打印测试账号明文的 `initDefaultUser`，以及本地 `test-password.js`。
- 删除静态 `public/ads.txt`（仍由动态路由按系统配置生成）；`robots.txt` 与信息页模板不再写死个人域名。
- 新增 `.env.example`、MIT LICENSE、GitHub Actions `docker-release.yaml`（推送 `v*.*.*` tag 后发布 `dingdangdog/loden` 多架构镜像并创建 Release）。
- Compose 改为从环境变量注入密钥，并修复 `volumes` 缩进。

## 影响范围

- `server/utils/password.ts`、`server/api/auth/[...].ts`、`nuxt.config.ts`、`server/plugins/init-db.ts`、`server/plugins/require-env.ts`
- `Dockerfile`、`docker-compose.yml`、`.github/workflows/docker-release.yaml`
- `.gitignore`、`.dockerignore`、`.env.example`、`LICENSE`、`README.md`、`DEPLOY.md`、`docs/quick-start.md`
- `public/robots.txt`、信息页模板、locales 广告 ID 示例文案

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 密码哈希算法不变。已部署实例必须在运行环境继续提供原来的 `NUXT_SALT` / `NUXT_AUTH_SECRET`。
- 已入库的信息页正文不受影响。

## 验证

- 静态检索 `login123` / `salt123` / `admin123456` / 真实 AdSense 示例 / `lodenhu.com` / Dockerfile 数据库口令：代码与配置中已无匹配。
- `git check-ignore`：`.env` 与 `env` 被忽略；`.env.example` 未被忽略。
- 服务启动、Docker 推送、GitHub Actions：未测试（按约束不启动服务、不真实发布）。

## 未做事项

- 未将密码哈希改为 bcrypt/argon2。
- 未改 Admin 加密配置回传方式。
- 未添加服务器侧 `update.sh` 自动滚动。
- GitHub Environment `docker_hub` 与 Docker Hub 仓库需维护者手动配置。
