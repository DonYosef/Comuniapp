-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "space_schedules" (
    "id" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "common_space_id" TEXT NOT NULL,

    CONSTRAINT "space_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "space_schedules_common_space_id_day_of_week_key" ON "space_schedules"("common_space_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "space_schedules" ADD CONSTRAINT "space_schedules_common_space_id_fkey" FOREIGN KEY ("common_space_id") REFERENCES "community_common_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
