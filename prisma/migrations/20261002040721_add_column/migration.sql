-- AlterTable
ALTER TABLE "article_bases" ADD COLUMN     "accessType" VARCHAR(20) NOT NULL DEFAULT 'FREE',
ADD COLUMN     "columnId" VARCHAR(36),
ADD COLUMN     "currency" VARCHAR(3),
ADD COLUMN     "priceAmount" INTEGER;

-- AlterTable
ALTER TABLE "article_contents" ADD COLUMN     "freeContent" TEXT;

-- CreateTable
CREATE TABLE "columns" (
    "id" VARCHAR(36) NOT NULL,
    "authorId" VARCHAR(36) NOT NULL,
    "featuredImage" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "currency" VARCHAR(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "column_contents" (
    "id" VARCHAR(36) NOT NULL,
    "columnId" VARCHAR(36) NOT NULL,
    "languageCode" VARCHAR(10) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "seoTitle" VARCHAR(200),
    "seoDescription" VARCHAR(500),
    "seoKeyword" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "column_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "column_subscriptions" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "columnId" VARCHAR(36) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'REDEEM',
    "orderId" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "column_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "column_subscription_logs" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "columnId" VARCHAR(36) NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'REDEEM',
    "redeemCodeId" VARCHAR(36),
    "orderId" VARCHAR(36),
    "durationDays" INTEGER NOT NULL,
    "previousExpiresAt" TIMESTAMP(3),
    "appliedFrom" TIMESTAMP(3) NOT NULL,
    "appliedTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "column_subscription_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "column_redeem_codes" (
    "id" VARCHAR(36) NOT NULL,
    "columnId" VARCHAR(36) NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'UNUSED',
    "createdBy" VARCHAR(36) NOT NULL,
    "usedBy" VARCHAR(36),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "column_redeem_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_unlocks" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "articleBaseId" VARCHAR(36) NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'REDEEM',
    "redeemCodeId" VARCHAR(36),
    "orderId" VARCHAR(36),
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_redeem_codes" (
    "id" VARCHAR(36) NOT NULL,
    "articleBaseId" VARCHAR(36) NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'UNUSED',
    "createdBy" VARCHAR(36) NOT NULL,
    "usedBy" VARCHAR(36),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_redeem_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "column_plans" (
    "id" VARCHAR(36) NOT NULL,
    "columnId" VARCHAR(36) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "column_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_orders" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "authorId" VARCHAR(36) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "productType" VARCHAR(32) NOT NULL,
    "columnId" VARCHAR(36),
    "articleBaseId" VARCHAR(36),
    "durationDays" INTEGER,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "provider" VARCHAR(32),
    "providerOrderId" VARCHAR(128),
    "idempotencyKey" VARCHAR(64),
    "paidAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_payments" (
    "id" VARCHAR(36) NOT NULL,
    "orderId" VARCHAR(36) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "provider" VARCHAR(32) NOT NULL,
    "providerPaymentId" VARCHAR(128),
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "failureMessage" VARCHAR(500),
    "payload" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_refunds" (
    "id" VARCHAR(36) NOT NULL,
    "orderId" VARCHAR(36) NOT NULL,
    "paymentId" VARCHAR(36),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "reason" VARCHAR(500),
    "providerRefundId" VARCHAR(128),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "columns_authorId_idx" ON "columns"("authorId");

-- CreateIndex
CREATE INDEX "columns_authorId_isPublished_idx" ON "columns"("authorId", "isPublished");

-- CreateIndex
CREATE INDEX "columns_isPublished_idx" ON "columns"("isPublished");

-- CreateIndex
CREATE INDEX "column_contents_columnId_idx" ON "column_contents"("columnId");

-- CreateIndex
CREATE INDEX "column_contents_languageCode_idx" ON "column_contents"("languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "column_contents_columnId_languageCode_key" ON "column_contents"("columnId", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "column_contents_slug_languageCode_key" ON "column_contents"("slug", "languageCode");

-- CreateIndex
CREATE INDEX "column_subscriptions_userId_idx" ON "column_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "column_subscriptions_columnId_idx" ON "column_subscriptions"("columnId");

-- CreateIndex
CREATE INDEX "column_subscriptions_expiresAt_idx" ON "column_subscriptions"("expiresAt");

-- CreateIndex
CREATE INDEX "column_subscriptions_orderId_idx" ON "column_subscriptions"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "column_subscriptions_userId_columnId_key" ON "column_subscriptions"("userId", "columnId");

-- CreateIndex
CREATE UNIQUE INDEX "column_subscription_logs_orderId_key" ON "column_subscription_logs"("orderId");

-- CreateIndex
CREATE INDEX "column_subscription_logs_userId_columnId_idx" ON "column_subscription_logs"("userId", "columnId");

-- CreateIndex
CREATE INDEX "column_subscription_logs_columnId_createdAt_idx" ON "column_subscription_logs"("columnId", "createdAt");

-- CreateIndex
CREATE INDEX "column_subscription_logs_redeemCodeId_idx" ON "column_subscription_logs"("redeemCodeId");

-- CreateIndex
CREATE INDEX "column_subscription_logs_orderId_idx" ON "column_subscription_logs"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "column_redeem_codes_code_key" ON "column_redeem_codes"("code");

-- CreateIndex
CREATE INDEX "column_redeem_codes_columnId_status_idx" ON "column_redeem_codes"("columnId", "status");

-- CreateIndex
CREATE INDEX "column_redeem_codes_createdBy_idx" ON "column_redeem_codes"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "article_unlocks_orderId_key" ON "article_unlocks"("orderId");

-- CreateIndex
CREATE INDEX "article_unlocks_userId_idx" ON "article_unlocks"("userId");

-- CreateIndex
CREATE INDEX "article_unlocks_articleBaseId_idx" ON "article_unlocks"("articleBaseId");

-- CreateIndex
CREATE INDEX "article_unlocks_redeemCodeId_idx" ON "article_unlocks"("redeemCodeId");

-- CreateIndex
CREATE INDEX "article_unlocks_orderId_idx" ON "article_unlocks"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "article_unlocks_userId_articleBaseId_key" ON "article_unlocks"("userId", "articleBaseId");

-- CreateIndex
CREATE UNIQUE INDEX "article_redeem_codes_code_key" ON "article_redeem_codes"("code");

-- CreateIndex
CREATE INDEX "article_redeem_codes_articleBaseId_status_idx" ON "article_redeem_codes"("articleBaseId", "status");

-- CreateIndex
CREATE INDEX "article_redeem_codes_createdBy_idx" ON "article_redeem_codes"("createdBy");

-- CreateIndex
CREATE INDEX "column_plans_columnId_isActive_idx" ON "column_plans"("columnId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "column_plans_columnId_durationDays_key" ON "column_plans"("columnId", "durationDays");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_orders_idempotencyKey_key" ON "commerce_orders"("idempotencyKey");

-- CreateIndex
CREATE INDEX "commerce_orders_userId_status_idx" ON "commerce_orders"("userId", "status");

-- CreateIndex
CREATE INDEX "commerce_orders_authorId_status_idx" ON "commerce_orders"("authorId", "status");

-- CreateIndex
CREATE INDEX "commerce_orders_columnId_idx" ON "commerce_orders"("columnId");

-- CreateIndex
CREATE INDEX "commerce_orders_articleBaseId_idx" ON "commerce_orders"("articleBaseId");

-- CreateIndex
CREATE INDEX "commerce_orders_provider_providerOrderId_idx" ON "commerce_orders"("provider", "providerOrderId");

-- CreateIndex
CREATE INDEX "commerce_orders_status_createdAt_idx" ON "commerce_orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "commerce_payments_orderId_status_idx" ON "commerce_payments"("orderId", "status");

-- CreateIndex
CREATE INDEX "commerce_payments_provider_providerPaymentId_idx" ON "commerce_payments"("provider", "providerPaymentId");

-- CreateIndex
CREATE INDEX "commerce_refunds_orderId_status_idx" ON "commerce_refunds"("orderId", "status");

-- CreateIndex
CREATE INDEX "commerce_refunds_paymentId_idx" ON "commerce_refunds"("paymentId");

-- CreateIndex
CREATE INDEX "commerce_refunds_providerRefundId_idx" ON "commerce_refunds"("providerRefundId");

-- CreateIndex
CREATE INDEX "article_bases_accessType_idx" ON "article_bases"("accessType");

-- CreateIndex
CREATE INDEX "article_bases_columnId_idx" ON "article_bases"("columnId");
