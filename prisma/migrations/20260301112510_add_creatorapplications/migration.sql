-- CreateTable
CREATE TABLE "creator_applications" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "penName" VARCHAR(100) NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "message" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" VARCHAR(36),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_applications_userId_idx" ON "creator_applications"("userId");

-- CreateIndex
CREATE INDEX "creator_applications_status_idx" ON "creator_applications"("status");

-- CreateIndex
CREATE INDEX "creator_applications_status_createdAt_idx" ON "creator_applications"("status", "createdAt");
