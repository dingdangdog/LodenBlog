-- CreateTable
CREATE TABLE "article_bookmarks" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "articleBaseId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_bookmarks_userId_idx" ON "article_bookmarks"("userId");

-- CreateIndex
CREATE INDEX "article_bookmarks_articleBaseId_idx" ON "article_bookmarks"("articleBaseId");

-- CreateIndex
CREATE UNIQUE INDEX "article_bookmarks_userId_articleBaseId_key" ON "article_bookmarks"("userId", "articleBaseId");
