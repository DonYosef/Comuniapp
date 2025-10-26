/*
  Warnings:

  - You are about to drop the column `concierge_name` on the `parcels` table. All the data in the column will be lost.
  - You are about to drop the column `concierge_phone` on the `parcels` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `parcels` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_email` on the `parcels` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_name` on the `parcels` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_phone` on the `parcels` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_residence` on the `parcels` table. All the data in the column will be lost.
  - You are about to drop the column `sender_phone` on the `parcels` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[community_id,name,type]` on the table `expense_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "expense_categories_community_id_name_key";

-- AlterTable
ALTER TABLE "expense_categories" ADD COLUMN     "type" "ExpenseType" NOT NULL DEFAULT 'EXPENSE';

-- AlterTable
ALTER TABLE "parcels" DROP COLUMN "concierge_name",
DROP COLUMN "concierge_phone",
DROP COLUMN "notes",
DROP COLUMN "recipient_email",
DROP COLUMN "recipient_name",
DROP COLUMN "recipient_phone",
DROP COLUMN "recipient_residence",
DROP COLUMN "sender_phone";

-- AlterTable
ALTER TABLE "visitors" ALTER COLUMN "entry_date" DROP NOT NULL,
ALTER COLUMN "visit_purpose" DROP DEFAULT,
ALTER COLUMN "expected_arrival" DROP DEFAULT,
ALTER COLUMN "expected_departure" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "expense_categories_type_idx" ON "expense_categories"("type");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_community_id_name_type_key" ON "expense_categories"("community_id", "name", "type");
