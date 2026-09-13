# 202609092330 - 帖子编辑可清空封面图

**日期：** 2026-09-09

## 背景 / 问题

编辑帖子时把封面链接清空后保存，数据库 `featuredImage` 仍保留旧值，无法删除封面。根因是前端把空字符串转成 `undefined`，PATCH 因此跳过该字段。

## 变更内容

- 保存/发布时，空封面或仅空白的封面链接改为提交 `null`。
- PATCH/POST 将空字符串规范为 `null`，写入数据库可清空字段。
- 编辑页增加「清空封面」按钮，预览与输入框同步清空。

## 影响范围

- `app/pages/admin/editpost.client.vue`
- `server/api/creator/articles/[id].patch.ts`
- `server/api/creator/articles/index.post.ts`
- `locales/{zh,en,ja,de,es}/admin/editpost.json`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 清空后字段为 `NULL`，与新建文章无封面时一致。

## 验证

- 对照保存 payload 与 PATCH 更新分支：空字符串、空白、`null` 均会写成 `NULL`；有链接时仍写入修剪后的 URL。
- 修改文件 lint：无新问题。
- 页面保存、发布、列表/详情封面展示：未测试（按约束不启动服务）。
