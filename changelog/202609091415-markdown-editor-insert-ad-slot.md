# 202609091415 - 发文编辑器增加插入广告位按钮

**日期：** 2026-09-09

## 背景 / 问题

文内广告渲染已存在（`.article-ads` 占位 + AdSense），但 Markdown 编辑器没有插入占位的工具栏按钮，作者只能手写 HTML，或依赖阅读页自动插入。

## 变更内容

- 发文页 Markdown 工具栏在选图按钮旁增加「插入广告位」，点击后在光标处写入 `<div class="article-ads"></div>`。
- 信息页共用编辑器默认不显示该按钮。
- 编辑器预览中空占位显示为虚线框，便于确认位置。
- 占位 HTML 抽到共用常量，与阅读页自动插入保持一致。
- 同步 zh / en / ja / de / es 文案。

## 影响范围

- `app/components/editor/MarkdownEditor.client.vue`
- `app/pages/admin/editpost.client.vue`
- `app/composables/useArticleAds.ts`
- `app/components/MarkdownRenderer.vue`
- `locales/{zh,en,ja,de,es}/admin/editpost.json`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 正文仍识别已有 `.article-ads`；插入后阅读页不再自动补第二处（与原逻辑一致）。

## 验证

- locale JSON 解析：通过。
- 编辑器点击插入、预览虚线框、明暗主题、阅读页广告渲染：未测试（按约束未启动服务）。

## 未做事项

- 未在浏览器中打开发文页做端到端点击验证。
