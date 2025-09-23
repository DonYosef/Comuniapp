/*
  Warnings:

  - You are about to drop the column `space` on the `space_reservations` table. All the data in the column will be lost.
  - Added the required column `common_space_id` to the `space_reservations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommunityType" AS ENUM ('CONDOMINIO', 'EDIFICIO');

-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "buildingStructure" JSONB,
ADD COLUMN     "constructionYear" INTEGER,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "floors" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "totalUnits" INTEGER,
ADD COLUMN     "type" "CommunityType" NOT NULL DEFAULT 'CONDOMINIO',
ADD COLUMN     "unitsPerFloor" INTEGER,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "space_reservations" DROP COLUMN "space",
ADD COLUMN     "common_space_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "community_common_spaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "community_id" TEXT NOT NULL,

    CONSTRAINT "community_common_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_common_spaces_community_id_name_key" ON "community_common_spaces"("community_id", "name");

-- AddForeignKey
ALTER TABLE "community_common_spaces" ADD CONSTRAINT "community_common_spaces_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_reservations" ADD CONSTRAINT "space_reservations_common_space_id_fkey" FOREIGN KEY ("common_space_id") REFERENCES "community_common_spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
