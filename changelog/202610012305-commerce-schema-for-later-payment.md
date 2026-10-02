# 专栏与付费文章补上价格和交易表

## 目的

本期仍然只通过兑换码开通阅读权，但数据库要按以后直接接支付来设计，避免上线后再改表。

## 变更

- 专栏增加 `currency`。订阅标价放在 `ColumnPlan`，按 30 / 90 / 365 天存最小货币单位金额。
- 单篇付费在 `ArticleBase` 增加 `priceAmount` 和 `currency`。金额为空表示尚未标价。
- 新增 `CommerceOrder`、`CommercePayment`、`CommerceRefund`。订单记录买家、卖家、商品、金额、渠道和幂等键；支付尝试和退款分开存放。
- 订阅流水和解锁记录的兑换码改为可空，并增加唯一的 `orderId`，方便以后一笔支付只发放一次权益。
- 导入导出带上这些新表。

## 影响范围

- `prisma/schema.prisma`
- `server/api/admin/system/export.post.ts`
- `server/api/admin/system/import.post.ts`
- `design/202610012200-column-and-paid-articles.md`

## 数据库

只改了 schema。没有生成 migration。开发者需要自行生成并执行 migration。现有兑换写入不填价格和订单，兼容这些可空字段。

## 验证

- `pnpm exec prisma generate`：成功。
- 未改兑换、付费墙和收银台，因此没有做支付流程验证。

## 未做

收银台、渠道回调、自动续费，以及退款后是否收回阅读权。
