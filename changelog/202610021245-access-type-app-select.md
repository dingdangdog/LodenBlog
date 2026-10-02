# 专栏与文章下拉改用封装选择器

**日期：** 2026-10-02

## 背景 / 问题

文章访问类型、所属专栏，以及专栏编辑里的语言、订阅状态和兑换时长，用的是浏览器原生 `select`，和后台已有的 `AppSelect` 不一致。

## 变更内容

- 文章编辑的访问类型、所属专栏改为 `AppSelect`。访问类型不可清空；专栏可搜索、可清空。
- 专栏编辑的内容语言、订阅状态筛选，兑换码时长，以及管理员专栏记录里的订阅状态筛选，同样改为 `AppSelect`。必选项关闭清空。

## 影响范围

- `app/pages/admin/editpost.client.vue`
- `app/pages/admin/editcolumn.client.vue`
- `app/pages/admin/column-records.client.vue`
- `app/components/admin/RedeemCodeManager.vue`

## 数据库与兼容性

- 无数据库影响。

## 验证

- 静态核对：上述页面已不再使用原生 `select`。
- 浏览器点击流程：未测试。

## 未做事项

- 评论、友链、创作者申请等更早页面里的原生下拉未改。
