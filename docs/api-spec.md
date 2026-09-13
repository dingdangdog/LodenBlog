# REST API 规范

本规范基于 `prisma/schema.prisma` 与功能需求，所有响应使用 `server/utils/result.ts`：
- 成功：`success(data)` → `{ c:200, m:'success', d: <payload> }`
- 失败：`error(message, data?)` → `{ c:500, m: message, d: data }`
- 未登录：`noLogin()` → `{ c:403, m:'not login', d:null }`
- 过期：`expiredToken()` → `{ c:401, m:'expired login', d:null }`

## 1. 角色与权限
- 角色值（User.role）：`USER` | `CREATOR` | `ADMIN`
- 权限矩阵：
  - 未登录：公开读取（文章/页面/分类/标签/语言）、注册、登录、获取公开设置、查看文章评论
  - 登录用户（USER）：发表评论、个人资料获取与更新、退出登录
  - 创作者（CREATOR/ADMIN）：文章/页面/分类/标签/媒体/语言/设置的增删改、发布/下线、评论审核

## 2. 认证与用户
### 2.1 注册
- POST /api/auth/register
- 权限：公开
- 请求体：
```json
{ "email": "x@x.com", "username": "alice", "password": "******" }
```
- 响应：
```json
{ "c":200, "m":"success", "d": { "user": { "id": "...", "email": "x@x.com", "username": "alice", "role": "USER" } } }
```

### 2.2 登录（密码/三方）
- POST /api/auth/login
- 权限：公开
- 请求体（密码方式）：
```json
{ "email": "x@x.com", "password": "******" }
```
- 请求体（三方方式，任一ID存在即可）：
```json
{ "provider": "google|github|twitter|facebook", "providerId": "xxx", "email": "x@x.com" }
```
- 响应：
```json
{ "c":200, "m":"success", "d": { "user": { "id":"...", "email":"x@x.com", "role":"USER" } } }
```

### 2.3 退出登录
- POST /api/auth/logout
- 权限：登录
- 响应：`success(null)`

### 2.4 我的信息
- GET /api/me
- 权限：登录
- 响应：`success({ user })`

### 2.5 更新我的信息
- PATCH /api/me
- 权限：登录
- 请求体（任意可选）：
```json
{ "avatar":"url", "bio":"text" }
```
- 响应：`success({ user })`

### 2.6 后台可见性
- GET /api/me/visibility
- 权限：公开或登录
- 响应：
```json
{ "c":200, "m":"success", "d": { "canAccessAdmin": true|false } }
```

## 3. 语言 Languages
### 3.1 获取语言列表
- GET /api/languages
- 权限：公开
- 响应：`success([{ id, code, name, nativeName, isActive, isDefault }])`

### 3.2 管理语言（创作者）
- POST /api/languages  请求体：{ code, name, nativeName, isActive?, isDefault? }
- PATCH /api/languages/:id  请求体：同上可选
- DELETE /api/languages/:id
- 权限：创作者

## 4. 设置 Settings
### 4.1 获取公开设置
- GET /api/settings/public
- 权限：公开
- 响应：`success({ title, description, keyword, logo, icon, defaultLang })`

### 4.2 获取/更新设置（创作者）
- GET /api/settings
- PUT /api/settings  请求体：
```json
{ "title":"...", "description":"...", "keyword":"...", "logo":"...", "icon":"...", "defaultLang":"zh_CN" }
```
- 权限：创作者

## 5. 分类 Categories
### 5.1 查询
- GET /api/categories?lang=zh&page=1&limit=20
- GET /api/categories/:id
- 权限：公开

### 5.2 管理（创作者）
- POST /api/categories  请求体：{ lang, slug, name, description?, color?, icon?, sortOrder? }
- PATCH /api/categories/:id  请求体：同上可选
- DELETE /api/categories/:id
- 权限：创作者

## 6. 标签 Tags
### 6.1 查询
- GET /api/tags?lang=zh&page=1&limit=20
- GET /api/tags/:id
- 权限：公开

### 6.2 管理（创作者）
- POST /api/tags  请求体：{ lang, slug, name, color? }
- PATCH /api/tags/:id  请求体：同上可选
- DELETE /api/tags/:id
- 权限：创作者

## 7. 文章 Articles
### 7.1 查询
- GET /api/articles?lang=zh&page=1&limit=10&category=slug&tag=slug&q=keyword&sort=-publishedAt
- GET /api/articles/:slug?lang=zh
- GET /api/articles/:slug/translations  // 返回其他语言版本摘要
- 权限：公开

### 7.2 管理（创作者）
- POST /api/articles  请求体：
```json
{ "lang":"zh", "title":"...", "content":"...", "excerpt":"...", "categoryId":"...", "tagIds":["..."], "featuredImage":"...", "slug":"..." }
```
- PATCH /api/articles/:id  请求体：同上可选
- DELETE /api/articles/:id
- POST /api/articles/:id/publish   // { }
- POST /api/articles/:id/unpublish // { }
- POST /api/articles/:id/translate // { "targetLang":"en-US", "service":"google|baidu|deepl" }
- 权限：创作者

## 8. 页面 Pages
### 8.1 查询
- GET /api/pages?lang=zh
- GET /api/pages/:slug?lang=zh
- 权限：公开

### 8.2 管理（创作者）
- POST /api/pages  请求体：{ lang, slug, title, content, excerpt?, seoTitle?, seoDescription?, isPublished? }
- PATCH /api/pages/:id
- DELETE /api/pages/:id
- POST /api/pages/:id/publish
- POST /api/pages/:id/unpublish
- 权限：创作者

## 9. 媒体 Media（图片/视频）

### 9.1 图片上传（创作者）
- POST /api/media/images/upload  (multipart/form-data)
- 权限：创作者
- 表单字段：
  - file: 二进制文件（必填）
  - filename: 自定义文件名（可选）
  - alt: 文本（可选）
  - caption: 文本（可选）
- 允许 MIME：image/jpeg, image/png, image/webp, image/gif, image/svg+xml（可配置）
- 响应：
```json
{ "c":200, "m":"success", "d": { "id": "media_id", "url": "/media/images/media_id", "width": 0, "height": 0, "mimeType": "image/png" } }
```

### 9.2 图片显示（公开路由）
- GET /media/images/:id
- 权限：公开
- 行为：
  - Content-Type: 根据文件类型返回
  - 支持缓存：ETag/Last-Modified，`Cache-Control: public, max-age=86400`
  - 支持图像处理查询参数（可选）：`w` 宽度，`h` 高度，`q` 质量(1-100)，`f` 格式(webp|jpeg|png)
  - 错误：不存在 → `error('not found')`

### 9.3 视频上传（创作者）
- POST /api/media/videos/upload  (multipart/form-data)
- 权限：创作者
- 表单字段：
  - file: 二进制文件（必填）
  - filename: 自定义文件名（可选）
  - caption: 文本（可选）
- 允许 MIME：video/mp4, video/webm, video/ogg（可配置）
- 响应：
```json
{ "c":200, "m":"success", "d": { "id": "media_id", "url": "/media/videos/media_id", "duration": 0, "mimeType": "video/mp4" } }
```

### 9.4 视频显示（公开路由，支持断点续传）
- GET /media/videos/:id
- 权限：公开
- 行为：
  - Content-Type: 根据文件类型返回
  - 支持 Range 请求（206 Partial Content），用于 HTML5 video 点播
  - 支持缓存：`Cache-Control: public, max-age=86400`
  - 错误：不存在 → `error('not found')`

### 9.5 媒体列表与删除（创作者）
- GET /api/media?page=1&limit=20&q=name&type=image|video
- DELETE /api/media/:id
- 权限：创作者
- 响应：
```json
{ "c":200, "m":"success", "d": { "items": [ { "id":"...", "mimeType":"image/png", "url":"/media/images/..." } ], "page":1, "limit":20, "total":100 } }
```

## 10. 评论 Comments
### 10.1 查询
- GET /api/articles/:slug/comments?lang=zh&page=1&limit=20
- 权限：公开

### 10.2 发表评论
- POST /api/articles/:slug/comments?lang=zh  请求体：{ content }
- 权限：登录用户

### 10.3 审核与管理（创作者）
- PATCH /api/comments/:id/approve
- PATCH /api/comments/:id/reject
- DELETE /api/comments/:id
- 权限：创作者

## 11. 错误码与约定
- 200：成功 → `success(data)`
- 401：会话过期 → `expiredToken()`
- 403：未登录/无权限 → `noLogin()` 或 `error('forbidden')`
- 404：资源不存在 → `error('not found')`
- 422：参数校验失败 → `result(422, 'validation error', details)`
- 500：服务器错误 → `error('server error')`

## 12. 常见字段说明
- lang：语言代码（`languages.code`），服务端需映射为 `languageId`
- slug：各资源在语言维度下唯一（文章/页面/分类/标签）
- 发布：文章/页面发布通过 `isPublished` 与 `status` 协同维护

## 13. 鉴权建议
- 中间件：
  - `authRequired`：校验登录态，失败返回 `noLogin()`
  - `creatorOnly`：校验角色为 `CREATOR`/`ADMIN`，失败返回 `error('forbidden')`
- 统一入参校验：所有写接口对 body/query 进行校验，失败返回 `result(422, ...)`
