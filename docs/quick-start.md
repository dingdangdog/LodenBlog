# 快速开始指南

本指南将帮助您快速搭建并运行 i18nBlog 系统。

## 前置要求

- Node.js 18+ 
- PostgreSQL 14+
- npm 或 pnpm

## 1. 安装步骤

### 1.1 克隆项目

```bash
git clone <your-repo-url>
cd i18nblog
```

### 1.2 安装依赖

```bash
npm install
```

### 1.3 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接：

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/i18nblog?schema=public"
NUXT_AUTH_SECRET="your-random-secret-key"
NUXT_SALT="your-random-salt"
```

**重要**: 在生产环境中，请使用强随机字符串替换 `NUXT_AUTH_SECRET` 和 `NUXT_SALT`。

### 1.4 创建数据库

在 PostgreSQL 中创建数据库：

```sql
CREATE DATABASE i18nblog;
```

### 1.5 运行数据库迁移

```bash
npx prisma migrate dev
```

这将创建所有必要的数据表。

### 1.6 生成 Prisma Client

```bash
npx prisma generate
```

## 2. 启动应用

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:7061` 启动。

### 生产模式

```bash
# 构建
npm run build

# 启动
npm run preview
```

## 3. 系统初始化

### 3.1 访问初始化页面

首次访问应用时，会自动跳转到 `/setup` 页面。

### 3.2 填写配置信息

**网站信息**：
- 网站标题：如"我的博客"
- 网站描述：如"一个基于 Nuxt 的多语言博客系统"
- 网站关键词：如"博客,技术,分享"（可选）
- 默认语言：选择中文、英文或日文

**管理员账号**：
- 邮箱：admin@example.com
- 用户名：admin
- 密码：至少6个字符

### 3.3 完成初始化

点击"开始初始化"按钮，系统将自动：
- 创建管理员账号
- 初始化三种语言（中文、英文、日文）
- 创建默认分类
- 保存系统设置

初始化成功后，会跳转到登录页面。

## 4. 登录系统

使用初始化时创建的管理员账号登录：
- 邮箱：admin@example.com（或您设置的邮箱）
- 密码：您设置的密码

## 5. （可选）初始化示例数据

登录后，您可以使用 API 创建示例数据：

```bash
curl -X POST http://localhost:7061/api/system/seed \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'
```

这将创建：
- 示例分类（技术、生活）
- 示例标签（教程、指南、新闻）

## 6. 创建第一篇文章

### 6.1 使用 API 创建

```bash
curl -X POST http://localhost:7061/api/creator/articles \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "hello-world",
    "title": "Hello World",
    "content": "This is my first article.",
    "excerpt": "My first article",
    "languageId": "<language_id>",
    "status": "PUBLISHED",
    "isPublished": true
  }'
```

注意：需要先获取 `languageId`，可以通过 `GET /api/languages` 获取。

### 6.2 查看文章

访问 `http://localhost:7061` 查看首页文章列表。

## 7. （可选）配置 OAuth 登录

### 7.1 GitHub OAuth

1. 访问 https://github.com/settings/developers
2. 创建 New OAuth App
3. 设置回调 URL: `http://localhost:7061/api/auth/callback/github`
4. 在 `env` 文件中添加：
   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```
5. 重启应用

### 7.2 Google OAuth

1. 访问 https://console.cloud.google.com/
2. 创建 OAuth 2.0 客户端 ID
3. 设置回调 URL: `http://localhost:7061/api/auth/callback/google`
4. 在 `env` 文件中添加：
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```
5. 重启应用

配置完成后，登录页面会显示 OAuth 登录按钮。

## 8. 用户角色管理

### 8.1 默认角色

- OAuth 登录用户默认为 `USER` 角色
- 邮箱注册用户默认为 `USER` 角色
- 系统初始化时创建的是 `ADMIN` 角色

### 8.2 升级用户为创作者

在数据库中直接修改：

```sql
-- 查看所有用户
SELECT id, email, username, role FROM users;

-- 升级为创作者
UPDATE users 
SET role = 'CREATOR' 
WHERE email = 'user@example.com';
```

### 8.3 升级用户为管理员

```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'user@example.com';
```

## 9. 常见问题

### 数据库连接失败

检查：
- PostgreSQL 是否正在运行
- 数据库凭据是否正确
- 数据库是否已创建

### 初始化失败

检查：
- 数据库迁移是否完成
- Prisma Client 是否已生成
- 查看浏览器控制台错误信息

### OAuth 登录失败

检查：
- OAuth 应用配置是否正确
- 回调 URL 是否匹配
- 环境变量是否已设置
- 应用是否已重启

### 权限错误

检查：
- 用户角色是否正确
- 是否已登录
- API 路径是否正确

## 10. 下一步

- 📖 阅读 [功能说明文档](./features.md)
- 🔧 查看 [系统配置指南](../README_SETUP.md)
- 📝 查看 [更新日志](../CHANGELOG.md)
- 🎨 自定义主题和样式
- 🌍 添加更多语言支持
- 📱 开发移动端适配

## 11. 开发命令参考

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run preview

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 查看数据库
npx prisma studio

# 重置数据库（谨慎使用）
npx prisma migrate reset
```

## 12. 技术支持

遇到问题？

- 查看 [文档](./features.md)
- 查看 [Issues](your-repo-issues-url)
- 提交 [Bug Report](your-repo-issues-url)

## 13. 贡献

欢迎贡献代码！请查看贡献指南（如果有）。

---

祝您使用愉快！ 🎉

