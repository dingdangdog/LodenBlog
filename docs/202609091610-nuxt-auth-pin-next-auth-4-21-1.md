# 为什么 Nuxt 项目里必须钉死 next-auth@4.21.1

最近把一套 Nuxt 4 的登录从「能跑」翻到「想把依赖升新一点」，结果被一串 WARN 和教育性的登录失败按在地上。表面上只是 `@sidebase/nuxt-auth` 旁边要不要带着 `next-auth`，实际上是 Nuxt、Nitro、pnpm 和 NextAuth 包导出策略撞在一起的老坑。这篇文章把原因、为什么不能升、现在安不安全、以及我最终怎么处理，按自己踩过的路径写清楚。

文中只涉及登录适配层本身，不写任何业务回调、用户表或权限逻辑。

## 先看到的现象

开发服务起来后，Nitro 打包阶段会连续打出类似警告：

```text
WARN  "next-auth/providers/google" is imported by "server/api/auth/[...].ts", but could not be resolved – treating it as an external dependency.

WARN  "next-auth/providers/credentials" is imported by "server/api/auth/[...].ts", but could not be resolved – treating it as an external dependency.

WARN  "next-auth/providers/github" is imported by "server/api/auth/[...].ts", but could not be resolved – treating it as an external dependency.

WARN  "next-auth/jwt" is imported by ".../@sidebase/nuxt-auth/.../nuxtAuthHandler.js", but could not be resolved – treating it as an external dependency.

WARN  "next-auth/core" is imported by ".../@sidebase/nuxt-auth/.../nuxtAuthHandler.js", but could not be resolved – treating it as an external dependency.
```

警告看起来像「解析不到就算了，当外部依赖」。很多人会当噪音划掉。接着登录就不可用：账号密码没反应，GitHub / Google 回调也进不去。

我试过两件「按常理该做」的事，结果一样：

1. 把 `next-auth` 升到 4.22+、4.24，甚至 5。
2. 不在项目里声明 `next-auth`，指望 `@sidebase/nuxt-auth` 自己带一份。

两条路都会回到同一串 WARN，登录照样挂。

## 第一个误区：nuxt-auth 并没有自带 next-auth

`@sidebase/nuxt-auth` 不是完整的鉴权内核，而是 Nuxt 适配层。`authjs` 这一路真正签发 JWT、跑 OAuth、提供 Google / GitHub / Credentials 的，是 `next-auth`。

看它的 `package.json` 就能确认：

```json
{
  "peerDependencies": {
    "next-auth": "~4.21.1"
  },
  "peerDependenciesMeta": {
    "next-auth": {
      "optional": true
    }
  }
}
```

要点有三个：

- 它是 **peer**，不是 bundled dependency。模块源码里 `import "next-auth/core"`，运行时要去你的工程里找这个包。
- 版本是 `~4.21.1`，只允许 4.21.x，不是 `^4`。
- 还标成了 **optional**。原因是模块还有 `local` provider，可以不接 Auth.js。你如果选了 `authjs`，optional 并不等于「可以不装」。

官方 Quick Start 写得很直白：除了 npm 之外，必须自己再装一次，而且点名版本：

```bash
pnpm i next-auth@4.21.1
```

文档同时警告：由于 NextAuth 的破坏性变更，**nuxt-auth 只兼容 4.23.0 以下**，建议钉死 `4.21.1`。

所以「用模块自带的那份」在 pnpm 项目里几乎必然失败。pnpm 是严格隔离：你不把 `next-auth` 写进自己的 `dependencies`，根目录的 `node_modules` 里就没有它。Nitro 去解析 `next-auth/providers/google` 时找不到，只能标成 external；运行时 Node 再 `import`，包不在，登录链路直接断。

npm 有时会把 peer 提到根上，看起来「没声明也能跑」。换 pnpm / yarn 就会原形毕露。这不是包管理器的 bug，是 peer + optional + 严格隔离叠在一起的预期行为。

## 那串 WARN 到底在说什么

这不是 ESLint，是 **Nitro / Vite / Rollup 在打服务端包时解析失败**。

两条导入链同时在找 `next-auth` 的子路径：

- 你的 catch-all 路由：`next-auth/providers/google`、`github`、`credentials`
- 模块内部的 `NuxtAuthHandler`：`next-auth/core`、`next-auth/jwt`

解析成功，这些模块会被打进 Nitro 产物。解析失败，打包器就说「当外部依赖处理」——意思是：构建时不管了，运行时再让 Node 去 `node_modules` 里找。

于是出现一种很迷惑的体验：构建「成功」了，只是黄字；worker 一启动或一登录，才变成 `Cannot find package 'next-auth'`，或 `Package subpath './core' is not defined by "exports"`。

WARN 是症状。根因是：**子路径在当前安装的那份 `next-auth` 上要么不存在，要么被 `exports` 藏起来了。**

## 为什么偏偏是 4.21.1

`@sidebase/nuxt-auth` 的 handler 直接引用了 NextAuth 当时还公开的内部入口：`next-auth/core` 和 `next-auth/jwt`。`4.21.1` 仍把这些子路径当可导入模块。

从 **4.23.0** 起，NextAuth 收紧了 `package.json` 的 `exports`，把 `./core` 这类内部路径撤出公开导出，为后来的 Auth.js / v5 做准备。Nitro 再用原来的方式去解析，就会变成：

```text
Package subpath './core' is not defined by "exports"
```

sidebase 自己的 issue 把这件事钉死了：[NextAuth >= v4.23.0 Breaking change](https://github.com/sidebase/nuxt-auth/issues/514)。维护者后来也承认：他们必须按新架构改一遍模块，改完之后将不再兼容 4.23 以下；但 1.x 这一改还没作为稳定方案交出来。于是 1.x 继续把 peer 钉在 `~4.21.1`。

`next-auth@5` 更彻底：包结构、provider 路径、handler API 都换了。`@sidebase/nuxt-auth@1.x` 接不上。

还有一个很容易忽略的细节：4.21.1 的 provider 是 CommonJS。Nuxt 工程通常是 ESM（`"type": "module"`），所以官方示例必须写成 `.default()`：

```ts
import { NuxtAuthHandler } from "#auth"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

export default NuxtAuthHandler({
  secret: process.env.NUXT_AUTH_SECRET,
  providers: [
    // @ts-expect-error ESM 加载 CJS provider 时要走 .default
    GithubProvider.default({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    // @ts-expect-error
    CredentialsProvider.default({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 在这里做你自己的校验，返回用户或 null
        return null
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
})
```

这不是项目怪癖，是 CJS provider 进 ESM 服务端时的互操作。版本一旦变成 ESM 优先，`.default` 往往是 `undefined`，provider 根本注册不上，登录会以另一种方式静默失败。

对应的 Nuxt 配置只需要声明走 Auth.js：

```ts
export default defineNuxtConfig({
  modules: ["@sidebase/nuxt-auth"],
  auth: {
    originEnvKey: "NUXT_AUTH_BASE_URL",
    provider: {
      type: "authjs",
      trustHost: false,
      addDefaultCallbackUrl: true,
    },
  },
})
```

`trustHost: false` 建议保持。生产环境把 `NUXT_AUTH_BASE_URL` 配成完整地址，例如 `https://example.com/api/auth`，不要只写域名根路径。

## 两种错误操作，为什么都会炸

**不声明 `next-auth`。**  
pnpm 不会把 optional peer 提升到你的应用根依赖。你的 `server/api/auth/[...].ts` 和模块内部的 `nuxtAuthHandler.js` 同时解析失败。这和 sidebase 的 [#748](https://github.com/sidebase/nuxt-auth/issues/748)、[#877](https://github.com/sidebase/nuxt-auth/issues/877) 是同一类问题。

**换成 4.22+ / 4.24 / 5。**  
包能装上，但 `exports` 不再导出 `./core`。Nitro 同样解析失败，运行时变成 `ERR_PACKAGE_PATH_NOT_EXPORTED`。登录一样不可用。扫描器可能暂时消停，应用却坏了。

`package.json` 里不要写成 `^4.21.1`。`^` 会进 4.22、4.23、4.24。正确的是 tilde 或精确版本：

```json
{
  "dependencies": {
    "@sidebase/nuxt-auth": "1.3.1",
    "next-auth": "~4.21.1"
  }
}
```

装完用包管理器确认实际版本，避免 lockfile 里悄悄多出另一份：

```bash
pnpm ls next-auth
```

看到的应该就是 `next-auth@4.21.1`。然后重新 `nuxt prepare` / 重启 dev，那串「treating it as an external dependency」应当消失，登录路由才能被真正打进 Nitro。

## 有没有新版本可以一起升上去

写这篇文章时（2026 年 9 月），情况是：

| 东西 | 状态 |
|---|---|
| `@sidebase/nuxt-auth` 稳定版 | `1.3.1`（2026-06-30），已是最新 |
| peer | 仍然是 `next-auth@~4.21.1` |
| sidebase 2.0 | 路线图有，npm 上没有 |
| 官方 `@auth/nuxt` | Auth.js 文档仍标注 Open PR |

1.3.x 修的是模块自己的刷新、cookie、Nuxt 4 兼容，**不放开** `next-auth` 的版本锁。把 nuxt-auth 从 1.1 升到 1.3，解决不了这篇文章里的 WARN。

sidebase 原本打算在 2.0 换成 Auth.js v5，相关讨论在 [Roadmap #1028](https://github.com/sidebase/nuxt-auth/issues/1028) 和 [Migration #673](https://github.com/sidebase/nuxt-auth/issues/673)。他们做过至少两轮迁移 PR，都因为 `@auth/core` / `oauth4webapi` 不稳定而停。维护者公开说过：对 Auth.js 当时的稳定性不放心，不愿带着坏依赖发稳定版。

后来 Auth.js 并入 Better Auth。有人建议 sidebase 直接迁过去，维护者拒绝了：Auth.js 可以无数据库 JWT session，Better Auth 默认要数据库 session，不是换个包名。Nuxt 社区现在的 Better Auth 封装也还在早期。

所以今天没有「只改版本号、业务登录代码不动」的同步升级。想离开 4.21.1，本质上是换鉴权内核：等 sidebase 2.0，或自己迁到 `nuxt-auth-utils` / Better Auth，并重写 handler、`signIn`、session 读取和 cookie。那是迁移项目，不是依赖升级。

## 钉在 4.21.1 上安不安全

这是我决定「先不动」之前最在意的问题。答案要拆开看，不能被 `npm audit` 的红字带跑。

扫描器几乎一定会报：

- `next-auth < 4.24.5`：[CVE-2023-48309](https://github.com/advisories/GHSA-v64w-49xw-qq89)，伪造空用户
- `next-auth < 4.24.15`：[CVE-2026-73419](https://github.com/advisories/GHSA-x445-f3h2-j279)，OAuth provider 混淆

两条补丁都在 4.24.x，而 4.24.x 会让当前 nuxt-auth 登录挂掉。所以问题变成：**这些洞打的是不是 Nuxt 这条路径。**

**CVE-2023-48309 对 NuxtAuth 基本不适用。**  
它只影响 Next.js 默认的 `withAuth` 中间件——那种只检查「有没有 session」的写法。攻击者拿一段不完整 JWT，可以看起来像已登录，但没有 email 和权限。sidebase 文档专门写了这一节：他们不用 Next 那套中间件，自己用 Nuxt / h3 的 session 工具。维护者在 [#1001](https://github.com/sidebase/nuxt-auth/issues/1001) 里把这个问题标成不影响模块。

锁文件里往往还会出现 `next@13`。那是 `next-auth@4.21.1` 的 peer，不是你的 Web 服务器。Nuxt 应用不会去跑 Next Server Actions，扫描器报的 Next SSRF 通常也不是这个站点的 HTTP 攻击面。

**CVE-2026-73419 命中版本，但完整利用条件很苛刻。**  
4.21.1 确实落在受影响范围。官方描述需要同时满足：多个 OAuth 提供商、**已登录状态下**把第二个提供商绑到当前用户、并且至少有一个提供商的回调可以不靠 PKCE 过关。若你只在登录页发起 OAuth、没有「登录后再绑第二个账号」的入口、也没有 NextAuth Adapter 那套 `linkAccount`，实际风险比扫描器写的小得多。这是库龄带来的理论风险，不是「必须立刻停用」。

我给自己的结论是：

- **可以继续用** `@sidebase/nuxt-auth@1.x` + `next-auth@4.21.1`
- audit 告警当作已知、已评估、暂不修复
- 不要为了消红字去升 `next-auth`

真正要守住的是用法，而不是版本号本身：

- `NUXT_AUTH_SECRET` 用足够长的随机串，启动时没有密钥就该失败
- `trustHost` 保持 `false`，不要随便信转发头里的 Host
- `NUXT_AUTH_BASE_URL` 写成带 `/api/auth` 的绝对地址
- 前端 middleware 只负责跳转登录页；接口授权必须在服务端再查 session，并且不要只判断「对象在不在」，至少确认用户身份字段存在，管理接口还要校验角色
- 生产走 HTTPS，session cookie 才能按 Auth.js 的安全前缀工作

也必须接受一个结构性限制：`next-auth` v4 已进维护模式。以后如果出现打到 **JWT 校验或 OAuth 回调核心** 的新洞，而 sidebase 还钉 4.21.1，那就不是 `pnpm update` 能救的，只能换栈。把这件事记在技术债清单里，比假装扫描器绿了更诚实。

## 我最终采用的方案

方案其实很短，短到和「升级依赖」的本能相反。

1. 在应用自己的 `dependencies` 里显式加上 `next-auth@~4.21.1`，和 `@sidebase/nuxt-auth` 的 peer 对齐。
2. 包管理器用 pnpm 时，不要假设 peer 会被自动提升。
3. catch-all 路由按官方方式引入 provider，CJS 互走 `.default()`。
4. 不把 `next-auth` 改成 `^4` 或 `5`，不删除它。
5. 把 `npm audit` 里那两条 next-auth CVE 记录为「Nuxt 路径已评估，无法随补丁版升级」。
6. 等 sidebase 2.0 或自己准备做鉴权迁移时，再单独立项，不和日常依赖升级绑在一起。

验证也很直接：重启 dev 后，Nitro 不应再把 `next-auth/core`、`next-auth/jwt`、`next-auth/providers/*` 当成 external；账号密码和 OAuth 回调能走完；`pnpm ls next-auth` 只有 4.21.1。

## 假如以后一定要离开 4.21.1

没有第三条「只升版本」的路。我给自己留的选项是：

1. **继续钉住。** 模块还在维护，Nuxt 4 能用。代价是永远停在 NextAuth v4。
2. **等 sidebase 2.0。** 官方说过要迁 Auth.js v5，但没有可跟的稳定时间表，也没有能用于生产的 npm dist-tag。
3. **换栈重写。** Nuxt 官方食谱方向是 `nuxt-auth-utils`（加密 cookie session，OAuth 要自己接）；或者 Better Auth。两者都要重写登录入口、session 形状和回调 URL，存量登录态会掉。

在那之前，我会把这对版本当作登录基础设施的冻结层：可以修自己的页面和授权逻辑，但不要去「整理」`next-auth`。

## 收尾

这件事情之所以别扭，是因为它违反依赖管理的直觉：扫描器说旧，文档说钉死，构建只警告不失败，失败发生在登录。把三件事分开之后就顺了——

- **解析失败**来自 pnpm 隔离，加上 NextAuth 4.23 起不再导出 `./core`
- **不能升级**是因为 `@sidebase/nuxt-auth@1.x` 还活在那套内部入口上，2.0 没交付
- **可以继续用**是因为那条最常被扫到的 CVE 打的是 Next.js 默认中间件，不是 NuxtAuth 自己的 session 工具；新的 OAuth mix-up 则要看你有没有「已登录再绑第二家」的路径

所以我把解决方案写成一句自己能执行的话：在 Nuxt 的 `authjs` 提供商上，把 `next-auth@4.21.1` 当作一等依赖钉死，把 audit 红字当成已知债，把真正的升级留给下一次鉴权迁移。
