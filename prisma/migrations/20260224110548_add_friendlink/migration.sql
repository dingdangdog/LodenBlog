-- CreateTable
CREATE TABLE "friend_links" (
    "id" VARCHAR(36) NOT NULL,
    "icon" VARCHAR(500),
    "url" VARCHAR(500) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "friend_links_isActive_sortOrder_idx" ON "friend_links"("isActive", "sortOrder");
