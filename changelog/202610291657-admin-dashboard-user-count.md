# 系统看板增加用户数量

## 目的

管理员在站点概况里需要直接看到注册用户总数，并且这块统计要排在待审批申请前面，与现有统计卡片保持同一行。

## 变更内容

- 新增 `server/api/admin/users/stats.get.ts`：管理员鉴权后返回用户表总数 `{ userCount }`。
- `app/pages/admin/index.client.vue`：在待审批申请前增加“用户数量”卡片，点击进入用户管理；大屏栅格由 9 列改为 10 列。初始加载和刷新都会读取该数量。
- 五种语言的 `locales/*/admin/dashboard.json` 增加 `dashboard.stats.userCount`。

## 影响

- 无数据库结构变更。
- 统计范围为 `users` 表全部用户，包含未启用账号。

## 验证

- 未在浏览器中登录后台核对展示。需要管理员打开 `/admin` 确认数量、同一行排列，以及点击进入用户管理。
