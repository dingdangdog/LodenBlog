-- CreateTable
CREATE TABLE "info_bases" (
    "id" VARCHAR(36) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "info_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "info_contents" (
    "id" VARCHAR(36) NOT NULL,
    "infoBaseId" VARCHAR(36) NOT NULL,
    "languageCode" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "info_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "info_bases_slug_key" ON "info_bases"("slug");

-- CreateIndex
CREATE INDEX "info_bases_slug_idx" ON "info_bases"("slug");

-- CreateIndex
CREATE INDEX "info_contents_infoBaseId_idx" ON "info_contents"("infoBaseId");

-- CreateIndex
CREATE INDEX "info_contents_languageCode_idx" ON "info_contents"("languageCode");

-- CreateIndex
CREATE INDEX "info_contents_languageCode_infoBaseId_idx" ON "info_contents"("languageCode", "infoBaseId");

-- CreateIndex
CREATE UNIQUE INDEX "info_contents_infoBaseId_languageCode_key" ON "info_contents"("infoBaseId", "languageCode");
