-- First, add new columns
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "visitor_email" TEXT;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "resident_name" TEXT;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "resident_phone" TEXT;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "visit_purpose" TEXT DEFAULT 'personal';
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "expected_arrival" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "expected_departure" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "vehicle_info" TEXT;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Update existing records to have proper values
UPDATE "visitors" SET "visit_purpose" = 'personal' WHERE "visit_purpose" IS NULL;
UPDATE "visitors" SET "expected_arrival" = CURRENT_TIMESTAMP WHERE "expected_arrival" IS NULL;
UPDATE "visitors" SET "expected_departure" = CURRENT_TIMESTAMP WHERE "expected_departure" IS NULL;

-- Make required columns NOT NULL
ALTER TABLE "visitors" ALTER COLUMN "visit_purpose" SET NOT NULL;
ALTER TABLE "visitors" ALTER COLUMN "expected_arrival" SET NOT NULL;
ALTER TABLE "visitors" ALTER COLUMN "expected_departure" SET NOT NULL;

-- Remove default value from status column
ALTER TABLE "visitors" ALTER COLUMN "status" DROP DEFAULT;

-- Create new enum type
CREATE TYPE "VisitorStatus_new" AS ENUM ('SCHEDULED', 'ARRIVED', 'COMPLETED', 'CANCELLED');

-- Update existing data to map old values to new values
UPDATE "visitors" SET "status" = 'SCHEDULED' WHERE "status" = 'REGISTERED';
UPDATE "visitors" SET "status" = 'ARRIVED' WHERE "status" = 'ENTERED';
UPDATE "visitors" SET "status" = 'COMPLETED' WHERE "status" = 'EXITED';
UPDATE "visitors" SET "status" = 'CANCELLED' WHERE "status" = 'EXPIRED';

-- Change column type
ALTER TABLE "visitors" ALTER COLUMN "status" TYPE "VisitorStatus_new" USING "status"::text::"VisitorStatus_new";

-- Drop old enum and rename new one
DROP TYPE "VisitorStatus";
ALTER TYPE "VisitorStatus_new" RENAME TO "VisitorStatus";

-- Set new default
ALTER TABLE "visitors" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
