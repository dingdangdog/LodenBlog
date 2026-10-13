# 发布镜像自动写入 NUXT_PUBLIC_VERSION

**日期：** 2026-10-13

## 背景 / 问题

发布工作流已把 tag 版本作为 `APP_VERSION` 传给 Docker 构建，但 `Dockerfile` 运行阶段写死了 `ENV NUXT_PUBLIC_VERSION=2.0.2`，镜像标签也写死为 `2.0.0`。容器运行时环境变量会覆盖 `runtimeConfig.public.version`，所以后台显示的版本号一直停在旧值。

## 变更内容

- `Dockerfile` 运行阶段改为 `ENV NUXT_PUBLIC_VERSION=$APP_VERSION`，随 tag 自动变化。
- `org.opencontainers.image.version` 改用 `$APP_VERSION`，新增 `org.opencontainers.image.revision`（提交 SHA）。
- 工作流新增「Check package.json version」：`package.json` 版本与 tag 不一致时给出警告，不中断发布。
- 工作流新增「Verify NUXT_PUBLIC_VERSION in image」：推送后拉取 amd64 镜像读取该变量，与 tag 不一致则发布失败，不会继续创建 GitHub Release。
- `.env.example` 中的 `NUXT_PUBLIC_VERSION=` 改为注释。空值会把镜像内版本覆盖成空字符串。

## 影响范围

- `Dockerfile`
- `.github/workflows/docker-release.yaml`
- `.env.example`

## 兼容性

- 不传 `APP_VERSION` 的本地 `docker build` 会显示 `dev`（原先是写死的 `2.0.2`）。
- 部署时如在 env 文件里显式设置了 `NUXT_PUBLIC_VERSION`，仍以部署配置为准。

## 验证

- 未在 GitHub Actions 上实际运行，需推送下一个 `v*.*.*` tag 验证。
- 本地未构建镜像。
