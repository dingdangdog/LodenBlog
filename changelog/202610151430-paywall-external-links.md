# 付费墙外部平台链接

## 目的

付费文章除了兑换码，还能把读者引到微信公众号、小报童等站外平台订阅或购买。平台不固定，所以由作者自填名称和链接，按 JSON 存储。

## 变更

- `ArticleBase` 新增 `externalLinks`（Text，JSON 数组）。每项为 `{ name, url, description? }`，与 `tags` 一样存成字符串。
- `utils/column-access.ts` 新增 `normalizeExternalLinks` / `serializeExternalLinks` / `parseExternalLinks`，前后端共用：
  - 名称和链接都为空的行丢弃；缺名称、链接不是 `http://` / `https://` 时拒绝保存。
  - 上限：最多 10 个，名称 30 字符，链接 500 字符，说明 100 字符。这几个数字只用于防止异常输入，可按需调整。
  - 库里损坏或不合规的 JSON 读取时返回空列表，不会下发到前台。
- 创建、更新文章接口接收 `externalLinks`；更新时只有作者本人能改，与访问类型的规则一致。创作者文章详情返回外链。
- 公开文章详情只在文章处于锁定状态时返回 `externalLinks`，已解锁、作者、管理员和免费文章都返回空数组。
- 付费墙（`ReadArticle.vue`）在兑换框下方列出外链，新窗口打开，带 `rel="noopener noreferrer nofollow"`。专栏未开放、不显示兑换框时，标题改为“前往以下平台阅读”。
- 文章编辑页的“阅读权限”区：访问类型为专栏订阅或单篇付费时显示“外部平台链接”，可增删行。外链随文章保存，不像访问类型那样即时保存。改回免费公开后，已有外链仍保留在库里，但前台不显示。
- 补齐中文、英文、日文、德文、西班牙文文案。

## 影响范围

- `prisma/schema.prisma` 与 `prisma/generated`
- `server/api/articles/[slug].get.ts`、`server/api/creator/articles/index.post.ts`、`[id].get.ts`、`[id].patch.ts`
- `utils/column-access.ts`、`utils/models.ts`
- `app/components/common/ReadArticle.vue`、`app/pages/admin/editpost.client.vue`
- `locales/*/base.json`、`locales/*/admin/editpost.json`

## 数据库

只改了 schema，并执行了 `prisma generate`。没有生成 migration。开发者需要自行生成并执行 migration（新增一个可空列），之后外链才能保存。存量文章为空，行为不变。系统导出/导入按整行读写 `article_bases`，会自动带上这一列。

## 验证

- `node --test utils/column-access.test.ts`：14 项通过（新增 6 项外链校验与解析）。
- `pnpm exec prisma generate`：成功。
- `tsc -p .nuxt/tsconfig.server.json --noEmit`：改动文件没有新增类型错误。`[slug].get.ts`、`[id].patch.ts` 中的 `possibly 'null'` 错误在改动前就存在。项目未安装 `vue-tsc`，Vue 文件未做类型检查。
- 未启动开发服务器，编辑页和付费墙的明暗主题、移动端布局待浏览器验证。

## 未做

- 专栏级外链：专栏页的兑换框暂不显示外链；专栏文章只显示文章自己配置的外链。
- 二维码图片（如公众号二维码）：目前只支持链接。
- 外链按语言区分：外链跨语言共享，所有语言版本显示同一组。
