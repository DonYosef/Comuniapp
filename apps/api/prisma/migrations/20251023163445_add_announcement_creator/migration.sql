/*
  Warnings:

  - Added the required column `created_by_id` to the `announcements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "created_by_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "announcements_community_id_idx" ON "announcements"("community_id");

-- CreateIndex
CREATE INDEX "announcements_created_by_id_idx" ON "announcements"("created_by_id");

-- CreateIndex
CREATE INDEX "announcements_is_active_idx" ON "announcements"("is_active");

-- CreateIndex
CREATE INDEX "announcements_published_at_idx" ON "announcements"("published_at");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
