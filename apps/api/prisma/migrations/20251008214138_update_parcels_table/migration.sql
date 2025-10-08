-- AlterTable
ALTER TABLE "parcels" ADD COLUMN     "concierge_name" TEXT,
ADD COLUMN     "concierge_phone" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recipient_email" TEXT,
ADD COLUMN     "recipient_name" TEXT,
ADD COLUMN     "recipient_phone" TEXT,
ADD COLUMN     "recipient_residence" TEXT,
ADD COLUMN     "sender_phone" TEXT;
