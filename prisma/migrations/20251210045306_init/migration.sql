-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100),
    "password" VARCHAR(255),
    "avatar" VARCHAR(500),
    "bio" TEXT,
    "role" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "googleId" VARCHAR(100),
    "githubId" VARCHAR(100),
    "twitterId" VARCHAR(100),
    "facebookId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" VARCHAR(36) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "nativeName" VARCHAR(50) NOT NULL,
    "flag" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_bases" (
    "id" VARCHAR(36) NOT NULL,
    "featuredImage" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" VARCHAR(36) NOT NULL,
    "categorySlug" VARCHAR(100),
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_contents" (
    "id" VARCHAR(36) NOT NULL,
    "articleBaseId" VARCHAR(36) NOT NULL,
    "languageCode" VARCHAR(10) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "seoTitle" VARCHAR(200),
    "seoDescription" VARCHAR(500),
    "seoKeyword" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" VARCHAR(36) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "icon" VARCHAR(100),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "languageCode" VARCHAR(10) NOT NULL,
    "parentId" VARCHAR(36),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" VARCHAR(36) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "languageCode" VARCHAR(10) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" VARCHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" VARCHAR(100),
    "authorEmail" VARCHAR(255),
    "authorUrl" VARCHAR(500),
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "articleBaseId" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36),
    "parentId" VARCHAR(36),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "alt" VARCHAR(255),
    "caption" VARCHAR(500),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploaderId" VARCHAR(36) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "keyword" VARCHAR(500) NOT NULL,
    "logo" VARCHAR(500) NOT NULL,
    "logoLight" VARCHAR(500),
    "logoDark" VARCHAR(500),
    "icon" VARCHAR(500) NOT NULL,
    "iconLight" VARCHAR(500),
    "iconDark" VARCHAR(500),
    "defaultLang" VARCHAR(10) NOT NULL,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "languageCode" VARCHAR(10),
    "i18nEnabled" BOOLEAN NOT NULL DEFAULT false,
    "primaryLanguage" VARCHAR(10),
    "targetLanguages" TEXT,
    "autoTranslateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "primaryTranslationProvider" VARCHAR(36),
    "fallbackTranslationProvider" VARCHAR(36),
    "customHead" TEXT,
    "customCSS" TEXT,
    "customJS" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" VARCHAR(36) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "seoTitle" VARCHAR(200),
    "seoDescription" VARCHAR(500),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "languageCode" VARCHAR(10) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creators" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "penName" VARCHAR(100) NOT NULL,
    "avatar" VARCHAR(500),
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_configs" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "apiKey" VARCHAR(500),
    "apiSecret" VARCHAR(500),
    "apiEndpoint" VARCHAR(500),
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "extraConfig" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_likes" (
    "id" VARCHAR(36) NOT NULL,
    "articleBaseId" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36),
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "mode" VARCHAR(20) NOT NULL,
    "colors" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_failure_logs" (
    "id" VARCHAR(36) NOT NULL,
    "articleBaseId" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "sourceContentId" VARCHAR(36) NOT NULL,
    "sourceLanguageCode" VARCHAR(10) NOT NULL,
    "targetLanguageCode" VARCHAR(10) NOT NULL,
    "providerId" VARCHAR(36),
    "errorMessage" TEXT NOT NULL,
    "errorDetails" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING_RETRY',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_failure_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36),
    "ipAddress" VARCHAR(45),
    "location" TEXT,
    "userAgent" VARCHAR(500),
    "loginMethod" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_googleId_idx" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_githubId_idx" ON "users"("githubId");

-- CreateIndex
CREATE INDEX "users_twitterId_idx" ON "users"("twitterId");

-- CreateIndex
CREATE INDEX "users_facebookId_idx" ON "users"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE INDEX "languages_code_idx" ON "languages"("code");

-- CreateIndex
CREATE INDEX "article_bases_authorId_idx" ON "article_bases"("authorId");

-- CreateIndex
CREATE INDEX "article_bases_categorySlug_idx" ON "article_bases"("categorySlug");

-- CreateIndex
CREATE INDEX "article_bases_status_publishedAt_idx" ON "article_bases"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "article_bases_isPublished_publishedAt_idx" ON "article_bases"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "article_contents_articleBaseId_idx" ON "article_contents"("articleBaseId");

-- CreateIndex
CREATE INDEX "article_contents_languageCode_idx" ON "article_contents"("languageCode");

-- CreateIndex
CREATE INDEX "article_contents_languageCode_slug_idx" ON "article_contents"("languageCode", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "article_contents_articleBaseId_languageCode_key" ON "article_contents"("articleBaseId", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "article_contents_slug_languageCode_key" ON "article_contents"("slug", "languageCode");

-- CreateIndex
CREATE INDEX "categories_languageCode_isActive_idx" ON "categories"("languageCode", "isActive");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_languageCode_key" ON "categories"("slug", "languageCode");

-- CreateIndex
CREATE INDEX "tags_languageCode_idx" ON "tags"("languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_languageCode_key" ON "tags"("slug", "languageCode");

-- CreateIndex
CREATE INDEX "comments_articleBaseId_idx" ON "comments"("articleBaseId");

-- CreateIndex
CREATE INDEX "comments_articleBaseId_parentId_idx" ON "comments"("articleBaseId", "parentId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "comments_isApproved_createdAt_idx" ON "comments"("isApproved", "createdAt");

-- CreateIndex
CREATE INDEX "media_uploaderId_idx" ON "media"("uploaderId");

-- CreateIndex
CREATE INDEX "settings_languageCode_idx" ON "settings"("languageCode");

-- CreateIndex
CREATE INDEX "pages_languageCode_isPublished_idx" ON "pages"("languageCode", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_languageCode_key" ON "pages"("slug", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "creators_userId_key" ON "creators"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "creators_key_key" ON "creators"("key");

-- CreateIndex
CREATE INDEX "creators_userId_idx" ON "creators"("userId");

-- CreateIndex
CREATE INDEX "creators_key_idx" ON "creators"("key");

-- CreateIndex
CREATE INDEX "translation_configs_provider_isActive_idx" ON "translation_configs"("provider", "isActive");

-- CreateIndex
CREATE INDEX "translation_configs_isActive_priority_idx" ON "translation_configs"("isActive", "priority");

-- CreateIndex
CREATE INDEX "article_likes_articleBaseId_idx" ON "article_likes"("articleBaseId");

-- CreateIndex
CREATE UNIQUE INDEX "article_likes_articleBaseId_userId_key" ON "article_likes"("articleBaseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "article_likes_articleBaseId_ipAddress_key" ON "article_likes"("articleBaseId", "ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "themes_name_key" ON "themes"("name");

-- CreateIndex
CREATE INDEX "themes_mode_isActive_idx" ON "themes"("mode", "isActive");

-- CreateIndex
CREATE INDEX "translation_failure_logs_articleBaseId_idx" ON "translation_failure_logs"("articleBaseId");

-- CreateIndex
CREATE INDEX "translation_failure_logs_userId_idx" ON "translation_failure_logs"("userId");

-- CreateIndex
CREATE INDEX "translation_failure_logs_userId_status_idx" ON "translation_failure_logs"("userId", "status");

-- CreateIndex
CREATE INDEX "translation_failure_logs_sourceContentId_idx" ON "translation_failure_logs"("sourceContentId");

-- CreateIndex
CREATE INDEX "translation_failure_logs_status_idx" ON "translation_failure_logs"("status");

-- CreateIndex
CREATE INDEX "translation_failure_logs_status_createdAt_idx" ON "translation_failure_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "translation_failure_logs_providerId_idx" ON "translation_failure_logs"("providerId");

-- CreateIndex
CREATE INDEX "login_logs_userId_idx" ON "login_logs"("userId");

-- CreateIndex
CREATE INDEX "login_logs_userId_createdAt_idx" ON "login_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "login_logs_ipAddress_idx" ON "login_logs"("ipAddress");

-- CreateIndex
CREATE INDEX "login_logs_loginMethod_idx" ON "login_logs"("loginMethod");

-- CreateIndex
CREATE INDEX "login_logs_status_idx" ON "login_logs"("status");

-- CreateIndex
CREATE INDEX "login_logs_status_createdAt_idx" ON "login_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "login_logs_createdAt_idx" ON "login_logs"("createdAt");
