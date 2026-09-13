# 202609092040 - 文章搜索支持多关键词分词

**日期：** 2026-09-09

## 背景 / 问题

前台 Header 搜索与后台文章列表搜索把整段输入当一个短语做 `contains`。输入「Docker、Java 后端」时无法拆成三个关键词，既搜不到分别命中这些词的文章，也容易被顿号、逗号干扰。

## 变更内容

- 新增共用拆词：按空白、顿号、中英文逗号/分号、竖线、间隔号切开；保留 `Vue.js`、`docker-compose`、`C++`；忽略大小写重复；最多 8 个词。
- 多词之间为 **AND**（每个词都必须命中）；同一词在多个字段之间为 OR。
- 前台 `/api/articles/search`：标题需同时包含全部关键词优先，不足 20 条再用标题或正文补齐。
- 后台 `/api/creator/articles`：每个关键词须命中标题或 slug。`id:` / `slug:` / UUID / cuid 精确查询不变。
- 搜索框在解析出两个及以上关键词时展示词条，并更新中/英/日/德/西文案。

## 影响范围

- `utils/search-keywords.ts`
- `server/api/articles/search.get.ts`
- `server/api/creator/articles/index.get.ts`
- `app/components/app/Header.vue`
- `app/pages/admin/posts.client.vue`
- `locales/*/common.json`、`locales/*/admin/posts.json`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 单关键词搜索行为与原来一致；多词从「整句包含」变为「逐词都要命中」。

## 验证

- `node --experimental-strip-types` 对拆词与 AND 条件构造：通过（含「Docker、Java 后端」→ 三词）。
- Lint：修改文件无新诊断。
- 前台搜索弹窗与后台文章列表真实查询：未测试（按约束未启动服务）。

## 未做事项

- 未改分类、标签、评论等其他搜索框。
- 未做「引号保短语」或 OR 匹配。
