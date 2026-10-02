# 专栏编辑增加文章选项卡

**日期：** 2026-10-02

## 背景 / 问题

- 把文章放进专栏只能到每篇文章的编辑页改访问类型，专栏编辑页不能直接管理专栏文章。

## 变更内容

- 已保存的专栏在编辑页增加「文章」选项卡。
- 默认列出作者最近 8 篇未加入该专栏的文章，也可以按标题或 slug 搜索后加入。
- 移出专栏后文章变为免费，`columnId` 清空。
- 加入付费文章，或从其他专栏移入时，先确认。付费文章加入后不再按单篇解锁；未使用的文章兑换码按原有规则失效。

## 影响范围

- `server/api/creator/columns/[id]/articles.get.ts`
- `server/api/creator/columns/[id]/articles.post.ts`
- `server/api/creator/columns/[id]/articles/[articleId].delete.ts`
- `app/pages/admin/editcolumn.client.vue`
- `locales/{zh,en,ja,de,es}/admin/columns.json`

## 数据库与兼容性

- 无表结构变化。一篇文章仍然只属于一个专栏。

## 验证

- 语言文件可解析，编辑页模板可编译。
- 未调用接口，未在浏览器中操作加入和移出。
