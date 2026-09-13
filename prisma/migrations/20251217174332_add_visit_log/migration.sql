/*
  Warnings:

  - You are about to drop the `pages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "pages";

-- CreateTable
CREATE TABLE "visit_logs" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36),
    "uri" VARCHAR(500) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_visit_logs" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36),
    "uri" VARCHAR(500) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_visit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visit_logs_userId_idx" ON "visit_logs"("userId");

-- CreateIndex
CREATE INDEX "visit_logs_userId_createdAt_idx" ON "visit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "visit_logs_ipAddress_idx" ON "visit_logs"("ipAddress");

-- CreateIndex
CREATE INDEX "visit_logs_createdAt_idx" ON "visit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "visit_logs_uri_idx" ON "visit_logs"("uri");

-- CreateIndex
CREATE INDEX "admin_visit_logs_userId_idx" ON "admin_visit_logs"("userId");

-- CreateIndex
CREATE INDEX "admin_visit_logs_userId_createdAt_idx" ON "admin_visit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_visit_logs_ipAddress_idx" ON "admin_visit_logs"("ipAddress");

-- CreateIndex
CREATE INDEX "admin_visit_logs_createdAt_idx" ON "admin_visit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_visit_logs_uri_idx" ON "admin_visit_logs"("uri");
