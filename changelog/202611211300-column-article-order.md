# 202611211300 - 专栏文章手动排序

**日期：** 2026-11-21

## 背景 / 问题

专栏文章在管理端按最近更新时间排列，公开页面按发布时间排列，作者无法指定文章顺序。新增专栏内排序，让管理端与读者看到的顺序一致。

## 变更内容

- 为文章增加专栏内排序值；新加入专栏的文章排在末尾。
- 在专栏管理页提供上移、下移操作，并保存排序结果。
- 公开专栏页按保存的顺序展示；尚未手动调整的文章仍按发布时间排列。
- 补齐中文、英语、德语、西班牙语和日语文案。

## 影响范围

- `prisma/schema.prisma`
- `server/api/creator/columns/[id]/articles.get.ts`
- `server/api/creator/columns/[id]/articles.post.ts`
- `server/api/creator/columns/[id]/articles/order.put.ts`
- `server/api/columns/[slug].get.ts`
- `app/pages/admin/editcolumn.client.vue`
- `locales/*/admin/columns.json`

## 数据库与兼容性

- 新增 `ArticleBase.columnOrder`，默认值为 `0`；无需回填存量数据。
- 未生成 Prisma migration，也未生成 Prisma Client。开发者需自行生成并应用 migration，同时重新生成 Prisma Client 后再部署。

## 验证

- `git diff --check`：通过；Git 提示部分文件的 LF/CRLF 转换警告。
- `pnpm exec prisma validate`：通过。
- Node.js JSON 解析：5 种语言的专栏文案均有效。
- Vue 脚本/模板与 4 个 API TypeScript 文件语法检查：通过（未执行完整类型检查）。
- 未启动服务，未运行测试或浏览器视觉检查。

## 未做事项

- 完成 Prisma migration 和 Client 生成后，需在管理端与公开专栏页面人工确认排序效果。
