# 202609092145 - 拆分 TranslationConfig 与 AI 配置表

**日期：** 2026-09-09

## 背景 / 问题

`TranslationConfig` 同时承担机器翻译与 AI 服务商配置。AI 写文章、主题生成也读这张表，默认还可能落到机器翻译。需要拆成两张表，同时保留翻译功能选用 AI 的能力。

## 变更内容

- 新增 `AiConfig` / `ai_configs`；`TranslationConfig` 只保留机器翻译协议。
- `Setting.primaryTranslationProvider` 约定关联 AI 配置；`fallbackTranslationProvider` 约定关联机器翻译。
- 翻译查询两表；AI 写文章 / 主题生成 / 优化只查 `AiConfig`。
- 系统设置新增「AI 配置」Tab；翻译 Tab 的 AI/机器下拉与表格职责分离。
- 导入导出增加 `aiConfigs`。启动时幂等把旧表中的 AI 行按原 ID 迁入新表。

## 影响范围

- `prisma/schema.prisma`
- `server/utils/provider-kind.ts`、`server/utils/provider-config.ts`
- `server/ai/provider.ts`、`server/utils/translater.ts`
- `server/api/admin/ai-configs/*`、`server/api/creator/ai-configs.get.ts`
- `server/api/admin/translations*`、`server/api/creator/translations.get.ts`
- `server/api/admin/settings.put.ts`、导入导出、init-db
- `app/components/system/AiSettings.vue`、`TranslationSettings.vue`、`ThemesSettings.vue`
- `app/pages/admin/settings.client.vue`、`posts.client.vue`
- `locales/*/admin/ai.json`、`settings.json`、`translation.json`

## 数据库与兼容性

- schema 新增 `ai_configs` 表，未生成 Prisma migration。
- **请开发者自行执行** `npx prisma migrate dev`（或等价命令）后再启动服务。
- 存量库第一次启动会把 `translation_configs` 中的 AI 行迁到 `ai_configs`（保留原 ID），并清空失效的 Setting 指针。
- 旧备份只有 `translationConfigs` 时仍可导入，启动后再拆行。

## 验证

- `npx prisma generate`：通过（Prisma Client 7.10.0 已生成到 `prisma/generated`）。
- 修改文件 Lint：无新诊断。
- 后台两 Tab、翻译弹窗可选 AI、写文章下拉仅 AI：未测试（按约束未启动服务）。

## 未做事项

- 未生成 Prisma migration。
- 未在浏览器中验证后台界面。
