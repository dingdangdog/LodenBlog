-- CreateTable
CREATE TABLE "system_configs" (
    "id" VARCHAR(36) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT,
    "description" VARCHAR(500),
    "category" VARCHAR(50),
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_category_idx" ON "system_configs"("category");
