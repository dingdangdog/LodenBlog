# 002 — 管理端系统设置默认进入翻译设置

**日期**：2025-03-24  

## 需求

系统设置页在无 `?tab=` 参数时，默认展示「翻译设置」选项卡，与导航栏首位 tab 一致，减少多一次点击。

## 改动

- 在 `app/pages/admin/settings.client.vue` 中，将 `activeTab` 的默认值由 `"site"` 改为 `"translation"`；带合法 `tab` 查询参数时行为不变。
