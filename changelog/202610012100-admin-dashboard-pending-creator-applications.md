# 系统看板展示创作者申请待审批数量

## 背景

"申请成为创作者"功能链路（页头入口、申请页 `/apply-creator`、用户端/管理端 API、审批页 `/admin/creatorapplications`）此前已完整实现，但管理员需要主动进入审批页才能发现新申请。本次在系统看板顶部统计区新增"待审批申请"卡片，便于管理员第一时间感知待处理的创作者申请。

## 变更内容

### 新增

- `server/api/admin/creator-applications/stats.get.ts`
  - 新增创作者申请统计 API，`requireAdmin` 鉴权后返回 `{ pendingCount }`（`status = "PENDING"` 的申请数量）。

### 修改

- `app/pages/admin/index.client.vue`
  - 顶部统计卡片区新增"待审批申请"卡片，数量大于 0 时以红色高亮提示；整卡为 `NuxtLink`，点击跳转 `/admin/creatorapplications` 审批页。
  - 统计卡片栅格由 `xl:grid-cols-8` 调整为 `xl:grid-cols-9`，使 9 个卡片在大屏下保持单行排列。
  - 新增 `loadPendingApplications()` 加载函数，并接入页面初始加载 `Promise.all` 与 `refreshAll` 刷新逻辑。

- 国际化文案：在 5 种语言的 `locales/{zh,en,es,de,ja}/admin/dashboard.json` 的 `dashboard.stats` 下新增 `pendingCreatorApplications` 键：
  - zh：待审批申请
  - en：Pending Applications
  - es：Solicitudes pendientes
  - de：Ausstehende Anträge
  - ja：承認待ち申請

## 验证

- 管理员登录后访问 `/admin` 看板，确认"待审批申请"卡片展示正确数量，点击可跳转审批页。
- 普通用户提交新申请后刷新看板，数量相应增加；审批（通过/驳回）后数量相应减少。
