# 202609091750 - 修复文章页文内广告位不渲染

**日期：** 2026-09-09

## 背景 / 问题

`https://www.oldmoon.top/post/169` 正文里有 3 处 `.article-ads` 占位，系统广告开关与 Slot 均已开启，但占位始终为空，未写入 AdSense `ins`。根因是 `MarkdownRenderer` 用 `watch(() => [content, loading])` 监听了 ref 对象而不是 `loading.value`，预览结束时不会再次触发渲染；同时把 `window.adsbygoogle` 已存在当成前置条件，异步脚本未就绪时会直接放弃。

控制台 `lidar.js` 的 `Permissions policy violation: unload` 来自 AdSense 广告 iframe 内的 Google 脚本与 Chrome 对 `unload` 的默认限制，站点未设置该策略，也不影响文内占位注入。

## 变更内容

- 广告渲染改为在 DOM 更新后监听正文、加载状态和广告开关，确保预览完成且配置就绪后会注入。
- 占位存在即可入队 `adsbygoogle.push`，不再等待脚本对象先出现；已填充的单元不会重复 push。
- 布局与 composable 共用 `/api/system/google-ads` 的 fetch key，AdSense 脚本增加 `key` 避免重复插入。

## 影响范围

- `app/components/MarkdownRenderer.vue`
- `app/composables/useArticleAds.ts`
- `app/layouts/default.vue`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 仍识别正文中已有 `.article-ads`；广告开关与 Slot 配置不变。

## 验证

- 线上文章页 DOM：3 个 `.article-ads` 为空、`/api/system/google-ads` 返回 `articleAdsEnabled: true`（修复前证据）。
- Lint：修改文件无新诊断。
- 修复后阅读页广告填充：未测试（按约束未启动服务；需部署后在生产页确认）。

## 未做事项

- 未部署，生产页广告仍会是旧逻辑。
- 未处理 AdSense `lidar.js` 的 `unload` 控制台提示（Google 侧脚本，无法由站点可靠消除）。
