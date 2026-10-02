# 付费 / 专栏文章标识与阅读页锁定区

**日期：** 2026-10-02

## 背景 / 问题

- 阅读页没有任何付费或专栏标识，免费试读内容后面直接接一个兑换框，读者不知道自己在读试读部分。
- 文章列表的「付费」小灰标签放在标题后面，和标题挤在一起，看不出是什么。

## 变更内容

- 新增 `CommonArticleAccessBadge`：付费文章用琥珀色加锁图标，专栏文章用主题色加专栏图标，免费文章不显示。悬停显示「付费文章 / 专栏文章」。列表和阅读页共用这一个组件。
- 文章列表：标识放在标题左侧，与标题同行，标题换行时自然折行；去掉原来标题后面的灰色标签。
- 阅读页头部：
  - 标题左侧显示大号标识。
  - 标题下新增一行状态：锁定时显示「试读中」；已解锁显示「已解锁」，专栏订阅有效时显示「订阅有效至 某日」；专栏文章附带「收录于专栏「名称」」链接。
- 阅读页锁定区：
  - 试读内容底部 8rem 用遮罩渐隐（CSS mask，不依赖背景色，双语模式也适用）。
  - 渐隐后加「试读结束」分隔线；没有试读内容时不显示渐隐和分隔线。
  - 锁定区改成居中卡片：锁图标、标题（沿用缩短后的「兑换解锁」/「订阅专栏后可阅读全文」）、过期或专栏未开放时的说明、兑换框、专栏链接。
- 五种语言新增 `column.paidArticle`、`columnArticle`、`previewing`、`previewEnd`、`subscribedUntil`、`fullAccess`、`inColumn`。

## 影响范围

- `app/components/common/ArticleAccessBadge.vue`（新增）
- `app/components/common/ArticleCard.vue`
- `app/components/common/ReadArticle.vue`（`post/[slug].vue` 与双语面板都通过它渲染）
- `locales/{zh,en,ja,de,es}/base.json`

## 数据库与兼容性

- 无表结构和接口变化，使用详情接口已有的 `accessType`、`locked`、`lockReason`、`column`、`subscriptionExpiresAt`。

## 验证

- 五个语言文件 JSON 解析通过。
- 三个组件用 `vue/compiler-sfc` 编译通过。
- 项目未安装 `vue-tsc`，未做类型检查。
- 未在浏览器中查看，明暗主题、移动端和长标题的显示需要人工确认。
