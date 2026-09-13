# 202609101427 - 页脚增加开源仓库 GitHub 按钮

**日期：** 2026-09-10

## 背景 / 问题

页脚缺少开源仓库入口，需要一个可跳转到 GitHub 的图标按钮，并在明暗主题下保持可读对比。

## 变更内容

- 在页脚版权后增加 GitHub 图标按钮，新窗口打开 `https://github.com/dingdangdog/LodenBlog`。
- 图标使用 `currentColor` 继承 `text-muted` / `text-foreground`，悬停时切换前景色与浅底，明暗主题同步变色。
- 无障碍名称复用已有 `footer.social.github` 文案。

## 影响范围

- `app/components/app/Footer.vue`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。

## 验证

- 对照页脚结构与主题 token：按钮位于版权后，外链属性完整，颜色走语义色而非固定黑白。
- 修改文件 lint：无新问题。
- 页脚明暗主题与点击跳转：未测试（按约束不启动服务）。
