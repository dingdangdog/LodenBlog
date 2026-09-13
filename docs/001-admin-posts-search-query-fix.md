# 001 — 管理端文章列表搜索逻辑修正

**日期**：2025-03-24  

## 问题

在 `app/pages/admin/posts.client.vue` 中，搜索框对「无空格、仅字母数字与 `-_./`」的输入会走 `slug` 精确查询；后端 `/api/creator/articles` 在传入 `slug` 时只做 **slug 完全匹配**，不会按标题模糊检索。因此仅输入英文单词、连续拼音等常见关键词时，无法命中标题。

## 改动

- 抽出 `articleListSearchQuery()`：除显式前缀 `id:`、`slug:` 外，**默认一律使用 `search`**，与后端「标题 + slug 的 `contains`、不区分大小写」行为一致。
- 移除「看起来像 slug 就自动当 slug」的启发式。
- 自动按 ID 查询仅保留：标准 UUID、以及 Prisma `@default(cuid())` 常见的 `c` + 24 位小写字母数字形态；避免原先「任意 16+ 位 `[a-z0-9_-]`」把长英文单词误判为 ID。

## 使用说明

- **关键词**（标题 / slug 子串）：直接输入，如 `Vue`、`gongzuo`。
- **精确 slug**：`slug:my-post-slug`。
- **按 ID**：`id:<完整ID>`，或直接粘贴 UUID / 典型 cuid（`c` 开头 25 位）。
