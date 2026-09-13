# 后端开发规范（Nuxt Server / Nitro API）

本文档用于约束团队在 `server/`（API 路由、服务端中间件、工具函数）侧的实现方式，重点保证鉴权一致性、权限安全和接口返回统一。

## 1. 认证与权限：统一拦截器

1. 后端认证与权限校验必须基于项目已有的中间件实现，禁止在每个接口里重复写登录/角色校验逻辑。
2. 认证中间件：`server/middleware/auth.ts`
   - 仅对 `/api/entry`、`/api/creator`、`/api/admin` 前缀的接口进行会话校验。
   - 校验通过后将用户信息注入 `event.context.user`。
3. 权限中间件：`server/middleware/permission.ts`
   - 对同样的路径前缀进行角色门槛校验：
     - `/api/admin` -> `ROLE_LEVEL.ADMIN`
     - `/api/creator` -> `ROLE_LEVEL.CREATOR`
     - `/api/entry` -> `ROLE_LEVEL.USER`
   - 当用户角色不足时返回 `403`，未登录返回 `401`。
4. 角色等级定义：`utils/role.ts`
   - `USER = 1`，`CREATOR = 2`，`ADMIN = 99`

## 2. API Handler 编写规范

1. 统一返回结构：必须使用 `server/utils/result.ts`
   - 成功：`success(data, message?)`，`c=200`
   - 失败：`error(message, data?)`，`c=500`
2. 参数解析与校验：
   - 统一使用 `const body = await readBody(event)` 获取请求体。
   - 所有写接口（新增/更新/删除/上传等）都必须校验必填字段，不允许依赖前端。
   - 当缺少必填字段时，直接 `return error("xxx 是必填项")` 或等价信息。
3. 权限校验工具函数（可选，但推荐用于增强可读性）：
   - `requireAuth(event)`：要求已登录
   - `requireCreator(event)`：要求创作者及以上
   - `requireAdmin(event)`：要求管理员及以上
   - `requireOwnerOrAdmin(event, ownerId)`：要求资源所有者或管理员

> 参考实现：
> - `server/api/admin/system-config.put.ts` 使用必填字段与格式校验后 `return error(...)` / `return success(...)`。
> - `server/api/entry/me/changepass.post.ts` 对新密码必填与长度进行校验。

## 3. 写接口的“必填字段”约定

1. 服务端的“必填”必须来自接口语义（如系统配置 `metadata.isRequired`、业务参数约束）。
2. 错误信息要可直接展示给前端用户，优先使用：
   - `xxx 不能为空`
   - `xxx 是必填项`
3. 当存在额外约束（如长度/枚举值/文件类型），必须分别校验并返回明确 message（不要只返回通用“参数错误”）。

## 4. 不要绕开鉴权

1. 对新增的需要登录/角色限制的接口：
   - 首先确认它属于 `/api/entry`、`/api/creator`、`/api/admin` 哪一类前缀
   - 不要在接口内部自行实现登录校验；使用项目工具函数 `requireAuth/requireCreator/requireAdmin`（可读性优先）或直接依赖中间件。
2. 公开读接口（如文章列表、公开设置获取等）必须保持不拦截，避免误拦截导致 SEO/公共访问异常。

