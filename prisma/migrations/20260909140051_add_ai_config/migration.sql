-- CreateTable
CREATE TABLE "ai_configs" (
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

    CONSTRAINT "ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_configs_provider_isActive_idx" ON "ai_configs"("provider", "isActive");

-- CreateIndex
CREATE INDEX "ai_configs_isActive_priority_idx" ON "ai_configs"("isActive", "priority");
