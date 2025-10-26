-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'FLOW';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "flow_order" TEXT;

-- CreateIndex
CREATE INDEX "payments_reference_idx" ON "payments"("reference");

