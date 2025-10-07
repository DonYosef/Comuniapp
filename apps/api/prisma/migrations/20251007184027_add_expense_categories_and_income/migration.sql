-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('EXPENSE', 'INCOME');

-- AlterTable
ALTER TABLE "community_expense_items" ADD COLUMN     "category_id" TEXT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "category_id" TEXT;

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "community_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_income" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "prorrate_method" "ProrrateMethod" NOT NULL DEFAULT 'EQUAL',

    CONSTRAINT "community_income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_income_items" (
    "id" TEXT NOT NULL,
    "community_income_id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_income_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_categories_community_id_idx" ON "expense_categories"("community_id");

-- CreateIndex
CREATE INDEX "expense_categories_is_active_idx" ON "expense_categories"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_community_id_name_key" ON "expense_categories"("community_id", "name");

-- CreateIndex
CREATE INDEX "community_income_community_id_idx" ON "community_income"("community_id");

-- CreateIndex
CREATE INDEX "community_income_period_idx" ON "community_income"("period");

-- CreateIndex
CREATE UNIQUE INDEX "community_income_community_id_period_key" ON "community_income"("community_id", "period");

-- CreateIndex
CREATE INDEX "community_income_items_categoryId_idx" ON "community_income_items"("categoryId");

-- CreateIndex
CREATE INDEX "communities_created_by_id_idx" ON "communities"("created_by_id");

-- CreateIndex
CREATE INDEX "communities_is_active_idx" ON "communities"("is_active");

-- CreateIndex
CREATE INDEX "communities_deleted_at_idx" ON "communities"("deleted_at");

-- CreateIndex
CREATE INDEX "communities_created_by_id_is_active_idx" ON "communities"("created_by_id", "is_active");

-- CreateIndex
CREATE INDEX "communities_created_by_id_deleted_at_idx" ON "communities"("created_by_id", "deleted_at");

-- CreateIndex
CREATE INDEX "communities_is_active_deleted_at_idx" ON "communities"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "communities_type_idx" ON "communities"("type");

-- CreateIndex
CREATE INDEX "communities_created_at_idx" ON "communities"("created_at");

-- CreateIndex
CREATE INDEX "community_expense_items_category_id_idx" ON "community_expense_items"("category_id");

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "expenses"("category_id");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_expense_items" ADD CONSTRAINT "community_expense_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_income" ADD CONSTRAINT "community_income_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_income_items" ADD CONSTRAINT "community_income_items_community_income_id_fkey" FOREIGN KEY ("community_income_id") REFERENCES "community_income"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_income_items" ADD CONSTRAINT "community_income_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
