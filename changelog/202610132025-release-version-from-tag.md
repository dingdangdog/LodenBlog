# 发布版本以 tag 为准，并回写 package.json

**日期：** 2026-10-13

## 背景 / 问题

上一版（`202610132015-release-sync-public-version.md`）在构建前比对 `package.json` 与 tag，不一致时发警告。这样把 `package.json` 当成了参照。版本号应只认发布时的 tag。

## 变更内容

- 删除工作流中的「Check package.json version」步骤。
- `Dockerfile` 构建阶段在 `pnpm build` 前执行 `npm pkg set version="$APP_VERSION"`。镜像内的 `package.json` 和构建产物里的默认版本都等于 tag；本地构建未传 `APP_VERSION`（值为 `dev`）时不改写。
- 工作流新增 `sync_package_version` 任务：发布时 checkout 默认分支，把 `package.json` 的 `version` 改成 tag 版本并以 `github-actions[bot]` 提交推送。
  - 版本已一致时跳过。
  - 默认分支上的版本比 tag 更新时（例如给旧版本补发 tag）跳过，不会降级。
  - 任务设为 `continue-on-error`。默认分支有保护规则、推送被拒时，不影响镜像和 GitHub Release。
- `docker_build` 任务新增输出 `version`（不带 `v` 前缀）。

## 影响范围

- `.github/workflows/docker-release.yaml`
- `Dockerfile`

## 注意

- 发布后默认分支会多一个 `chore: bump version to x.y.z` 提交，本地需要 `git pull`。
- 使用 `GITHUB_TOKEN` 推送不会再次触发工作流。

## 验证

- 未在 GitHub Actions 上实际运行，需推送下一个 `v*.*.*` tag 验证。
- 本地未构建镜像。
