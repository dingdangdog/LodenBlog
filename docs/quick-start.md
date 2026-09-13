# 快速开始指南

本指南将帮助您快速搭建并运行 i18nBlog 系统。

## 前置要求

- Node.js 18+ 
- PostgreSQL 14+
- npm 或 pnpm

## 1. 安装步骤简介

### 1.1 复制并修改Docker-compose

项目根目录有 [docker-compose.yml](../docker-compose.yml) 文件，建议直接复制并修改其中的环境变量

### 1.2 将配置文件上传至服务器

配置完成修改后，上传至服务器自定义文件夹

### 1.3 运行命令下载并启动

在 docker-compose.yaml 同级文件夹运行下面的命令，即可自动下载镜像（请保证您的服务器能够正常连接Docker）

```bash
docker-compose up -d
```

更详细部署教程请阅读【[DEPLOY](../DEPLOY.md)】

## 2. 系统初始化

### 2.1 访问初始化页面

首次访问应用时，会自动跳转到 `/setup` 页面。

### 2.2 填写配置信息

**网站信息**：
- 网站标题：如"我的博客"
- 网站描述：如"一个基于 Nuxt 的多语言博客系统"
- 网站关键词：如"博客,技术,分享"（可选）
- 默认语言：选择中文、英文或日文

**管理员账号**：
- 邮箱：admin@example.com
- 用户名：admin
- 密码：至少6个字符

### 2.3 完成初始化

点击"开始初始化"按钮，系统将自动：
- 创建管理员账号
- 初始化三种语言（中文、英文、日文）
- 创建默认分类
- 保存系统设置

初始化成功后，会跳转到登录页面。

## 3. 登录系统

使用初始化时创建的管理员账号登录：
- 邮箱：admin@example.com（或您设置的邮箱）
- 密码：您设置的密码

## 4. （可选）配置 OAuth 登录

### 4.1 GitHub OAuth

1. 访问 https://github.com/settings/developers
2. 创建 New OAuth App
3. 设置回调 URL: `http://localhost:7061/api/auth/callback/github`
4. 在 `env` 文件中添加：
   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```
5. 重启应用

### 4.2 Google OAuth

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

## 5. 常见问题

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

## 6. 下一步

- 📖 阅读 [功能说明文档](./features.md)
- 🔧 查看 [系统配置指南](../README_SETUP.md)
- 🎨 自定义主题和样式
- 🌍 添加更多语言支持

## 贡献

欢迎以各种方式对本项目做出贡献！

---

祝您使用愉快！ 🎉

