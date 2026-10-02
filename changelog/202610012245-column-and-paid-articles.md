# 专栏与单篇付费

## 目的

让创作者用兑换码开通专栏订阅和单篇永久解锁，未授权读者只能看到免费段，站点在不接入支付时也能使用同一套阅读权。

## 变更

- 文章增加 `accessType`（`FREE` / `COLUMN` / `PAID`）和 `columnId`。正文保存时按第一次 `<!--free-->` 写入 `freeContent`。
- 新增专栏、专栏多语言内容、订阅、订阅流水、专栏兑换码、文章解锁和文章兑换码。
- 公开文章详情按访问权裁剪正文；公开搜索不再用付费段匹配。专栏页、作者页、我的订阅、我的解锁、创作者专栏管理和管理员只读记录已接上。
- 兑换在事务内把未使用兑换码改为已使用。有效期内再次兑换从到期时间顺延，过期后从兑换时刻重算。

## 影响范围

- `prisma/schema.prisma` 与 `prisma/generated`
- 文章保存、翻译入库、公开详情、搜索、站点地图
- 创作者后台、读者个人中心、专栏页和文章付费墙
- `locales` 中文、英文、日文、西班牙文、德文

## 数据库

只改了 schema，并执行了 `prisma generate`。没有生成 migration。开发者需要自行生成并执行 migration，之后新字段才会在数据库里生效。存量文章会使用默认 `FREE`。

## 验证

- `node --experimental-strip-types --test utils/column-access.test.ts`：8 项通过。
- `pnpm exec prisma generate`：成功。
- 项目没有安装 `vue-tsc`，`nuxi typecheck` 无法运行。
- 未启动开发服务器，页面流程未在浏览器里点击验证。

## 未做

支付、价格、订单、退款、自动续费，以及一篇文章加入多个专栏。
