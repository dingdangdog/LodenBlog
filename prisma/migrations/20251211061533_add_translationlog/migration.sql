/*
  Warnings:

  - You are about to drop the `translation_failure_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "translation_failure_logs";

-- CreateTable
CREATE TABLE "translation_logs" (
    "id" VARCHAR(36) NOT NULL,
    "articleBaseId" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "sourceContentId" VARCHAR(36) NOT NULL,
    "sourceLanguageCode" VARCHAR(10) NOT NULL,
    "targetLanguageCode" VARCHAR(10) NOT NULL,
    "providerId" VARCHAR(36),
    "taskType" VARCHAR(20) NOT NULL DEFAULT 'TASK',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "errorDetails" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "translation_logs_articleBaseId_idx" ON "translation_logs"("articleBaseId");

-- CreateIndex
CREATE INDEX "translation_logs_userId_idx" ON "translation_logs"("userId");

-- CreateIndex
CREATE INDEX "translation_logs_userId_status_idx" ON "translation_logs"("userId", "status");

-- CreateIndex
CREATE INDEX "translation_logs_sourceContentId_idx" ON "translation_logs"("sourceContentId");

-- CreateIndex
CREATE INDEX "translation_logs_status_idx" ON "translation_logs"("status");

-- CreateIndex
CREATE INDEX "translation_logs_status_createdAt_idx" ON "translation_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "translation_logs_taskType_status_idx" ON "translation_logs"("taskType", "status");

-- CreateIndex
CREATE INDEX "translation_logs_taskType_status_createdAt_idx" ON "translation_logs"("taskType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "translation_logs_providerId_idx" ON "translation_logs"("providerId");
