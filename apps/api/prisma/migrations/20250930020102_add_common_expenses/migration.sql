-- CreateEnum
CREATE TYPE "ProrrateMethod" AS ENUM ('EQUAL', 'COEFFICIENT');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "community_expense_id" TEXT;

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "coefficient" DECIMAL(5,2) NOT NULL DEFAULT 1.00;

-- CreateTable
CREATE TABLE "community_expenses" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_expense_items" (
    "id" TEXT NOT NULL,
    "community_expense_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_expense_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_expenses_community_id_idx" ON "community_expenses"("community_id");

-- CreateIndex
CREATE INDEX "community_expenses_period_idx" ON "community_expenses"("period");

-- CreateIndex
CREATE UNIQUE INDEX "community_expenses_community_id_period_key" ON "community_expenses"("community_id", "period");

-- CreateIndex
CREATE INDEX "expenses_community_expense_id_idx" ON "expenses"("community_expense_id");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_community_expense_id_fkey" FOREIGN KEY ("community_expense_id") REFERENCES "community_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_expenses" ADD CONSTRAINT "community_expenses_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_expense_items" ADD CONSTRAINT "community_expense_items_community_expense_id_fkey" FOREIGN KEY ("community_expense_id") REFERENCES "community_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
