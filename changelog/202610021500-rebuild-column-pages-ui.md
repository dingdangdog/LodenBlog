# 专栏相关页面界面重构

**日期：** 2026-10-02

## 背景 / 问题

- 专栏前台、作者页专栏入口、个人中心订阅/解锁、后台专栏列表、编辑、兑换码和订阅记录都是临时堆出来的边框列表，和文章列表、作者页、后台文章编辑不是同一套界面。

## 变更内容

- 专栏详情改为作者页同级的封面头图、状态、文章数和兑换区，文章列表复用 `CommonArticleCard`。
- 作者页专栏入口改为带封面的横向卡片。
- 个人中心把订阅和解锁放进与「修改密码」相同的菜单行；订阅页和永久解锁页补齐加载、空状态和状态标签。
- 后台专栏列表对齐文章列表：封面、发布状态、查看和编辑。
- 专栏编辑对齐文章编辑：顶栏语言与保存/发布、内容与搜索信息分区、封面预览和媒体库选择；兑换码和订阅记录放进选项卡。
- 兑换码管理和订阅记录页改为可扫描的行列表，状态用颜色标签而不是原始枚举。

## 影响范围

- `app/pages/column/[slug].vue`
- `app/pages/author/[key].vue`
- `app/pages/my/index.vue`
- `app/pages/my/subscriptions.vue`
- `app/pages/my/unlocks.vue`
- `app/pages/admin/columns.client.vue`
- `app/pages/admin/editcolumn.client.vue`
- `app/pages/admin/column-records.client.vue`
- `app/components/admin/RedeemCodeManager.vue`（文章编辑里的付费兑换码也使用该组件）
- `locales/{zh,en,ja,de,es}/base.json`
- `locales/{zh,en,ja,de,es}/admin/columns.json`

## 数据库与兼容性

- 无表结构、接口和权限变化。

## 验证

- 五个语言的 `base.json` 与 `admin/columns.json` 可解析。
- 改动的 Vue 文件通过 `@vue/compiler-sfc` 解析。
- 未启动开发服务器，未在浏览器中查看明暗主题、窄屏和长标题。
