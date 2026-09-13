# 202609091859 - 按 Vanblog 思路在预览挂载后灌入文内广告

**日期：** 2026-09-09

## 背景 / 问题

`/post/482` 记录了 Vanblog 文内广告做法：占位 `.article-ads` 由页面异步渲染，需在 DOM 出现后写入 `ins` 并 `push`；SPA 内页面变化后再跑一遍。本站用 `MdPreview` 同样会晚于 Vue watch 输出/替换 HTML，只靠一次轮询容易灌早或被后续挂载冲掉。

## 变更内容

- 监听 `MdPreview` 的 `onRemount`（HTML 已挂进 DOM）再注入广告。
- 在预览容器上使用 MutationObserver：空占位再次出现时补灌；卸载时断开。
- 同一容器同一轮更新只 `push` 一次，避免 remount 与 observer 重复入队。
- 不照搬 Vanblog 对整个 `body`、footer 高度和 `window.onload` 插脚本的做法。

## 影响范围

- `app/composables/useArticleAds.ts`
- `app/components/MarkdownRenderer.vue`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 占位 class、AdSense client/slot 与开关逻辑不变。

## 验证

- Lint：修改文件无新诊断。
- 阅读页广告填充与 SPA 切文：未测试（按约束未启动服务；需部署后确认）。

## 未做事项

- 未部署，生产页仍是旧逻辑。
- 未改双语双栏下预览 `id` 重复问题。
