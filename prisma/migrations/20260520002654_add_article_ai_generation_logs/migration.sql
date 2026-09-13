-- CreateTable
CREATE TABLE "article_ai_generation_logs" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "languageCode" VARCHAR(10) NOT NULL,
    "contentRequirement" TEXT NOT NULL,
    "providerId" VARCHAR(36),
    "providerName" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    "articleBaseId" VARCHAR(36),
    "articleContentId" VARCHAR(36),
    "generatedSlug" VARCHAR(200),
    "contentLength" INTEGER,
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_ai_generation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_ai_generation_logs_userId_idx" ON "article_ai_generation_logs"("userId");

-- CreateIndex
CREATE INDEX "article_ai_generation_logs_userId_createdAt_idx" ON "article_ai_generation_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "article_ai_generation_logs_status_idx" ON "article_ai_generation_logs"("status");

-- CreateIndex
CREATE INDEX "article_ai_generation_logs_status_createdAt_idx" ON "article_ai_generation_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "article_ai_generation_logs_articleBaseId_idx" ON "article_ai_generation_logs"("articleBaseId");
