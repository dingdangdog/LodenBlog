# 202609092330 - 删除致谢信息页

**日期：** 2026-09-09

## 背景 / 问题

站点不再需要「致谢」信息页。模板、页脚文案和存量库中的 `thanks.html` 仍会创建或展示该页。

## 变更内容

- 删除 `server/info-template/thanks.ts`；默认信息页只保留用户协议、隐私政策、关于。
- 启动时幂等删除存量 `thanks` / `thanks.html`；公开列表与详情接口不再返回该 slug。
- 移除各语言 `footer.links.thanks` 文案。

## 影响范围

- `server/info-template/`
- `server/utils/init-info-pages.ts`
- `server/plugins/init-db.ts`
- `server/api/info/index.get.ts`、`server/api/info/[slug].get.ts`
- `locales/*/footer.json`

## 数据库与兼容性

- 无 schema 变化，不生成 Prisma migration。
- 启动时删除 `info_bases` / `info_contents` 中致谢页记录；用户协议等其它信息页不受影响。
- 已手工改过致谢正文的站点，该页内容会随记录一起删除。

## 验证

- 模板、slug、类型与公开接口已去掉 thanks；启动清理与 i18n 键已对齐。
- 页脚、信息页路由、后台信息页列表：未启动服务，待重启后人工确认。
