# 202609112231 - 修复标签页直开文章卡片粘连

**日期：** 2026-09-11

## 背景 / 问题

直接打开 `/tag/{slug}` 时，文章卡片会挤在一起、标题居中；从首页等站内跳转则正常。分类页没有这个问题。

根因是标签页 `useFetch` 未 `await`：服务端 HTML 在 `allArticles` 仍为空时输出「该标签下暂无文章」（带 `text-center`），文章只在 payload 中。客户端灌入卡片时 hydration 错位，卡片被贴进空状态容器，丢失 `space-y-6` 间距。分类页已 `await useFetch`，首屏即带卡片列表。

## 变更内容

- 标签页对 `/api/tags/counts` 和 `/api/articles` 改为 `await useFetch`，并在数据就绪后再结束 loading，与分类页一致。
- 保留 `query` 的 computed，切换标签时仍会按 slug 重新拉取第一页。

## 影响范围

- `app/pages/tag/[slug].vue`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。

## 验证

- 生产 `/tag/share` SSR HTML：输出「该标签下暂无文章」，payload 中有 15 篇文章（修复前证据）。
- 生产 `/category/technology` SSR HTML：已包含 `space-y-6` 与文章卡片（对照）。
- 修改文件 lint：无新问题。
- 修复后直开标签页视觉：未测试（按约束未启动服务；需部署后直开 `/tag/share` 确认卡片间距）。

## 未做事项

- 未改分类页。
- 标签/分类页顶部筛选芯片仍依赖客户端字典 store，直开时首屏可能暂无芯片，与本次粘连问题无关。
