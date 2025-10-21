-- AlterTable
ALTER TABLE "visitors" ADD COLUMN     "visitor_email" TEXT,
ADD COLUMN     "resident_name" TEXT,
ADD COLUMN     "resident_phone" TEXT,
ADD COLUMN     "visit_purpose" TEXT NOT NULL DEFAULT 'personal',
ADD COLUMN     "expected_arrival" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expected_departure" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vehicle_info" TEXT,
ADD COLUMN     "notes" TEXT;

-- Update existing records to have proper default values
UPDATE "visitors" SET 
    "visit_purpose" = 'personal',
    "expected_arrival" = CURRENT_TIMESTAMP,
    "expected_departure" = CURRENT_TIMESTAMP + INTERVAL '2 hours'
WHERE "visit_purpose" IS NULL;
