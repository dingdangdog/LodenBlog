# AI 生成文章：不再写入 SEO 标题与 SEO 描述

**日期**：2026-03-28

## 变更说明

`POST /api/creator/articles/generate-with-ai` 在创建 `ArticleContent` 时，原先将 `seoTitle` 设为文章标题、`seoDescription` 设为从正文截取的简介。

现改为 `seoTitle`、`seoDescription` 均为 `null`，与手动创建文章时 SEO 留空、以及展示层「无 SEO 字段则回退到 `title` / `excerpt`」的行为一致，避免数据库里重复存一份相同内容。

文章 `excerpt` 仍从生成正文中截取，供列表与摘要使用；SEO 展示由前端与 `useSEO` 的回退逻辑处理。

## 涉及文件

- `server/api/creator/articles/generate-with-ai.post.ts`
