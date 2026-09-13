-- AlterTable
ALTER TABLE "article_bases" ADD COLUMN     "pinOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "article_bases_pinOrder_idx" ON "article_bases"("pinOrder");
