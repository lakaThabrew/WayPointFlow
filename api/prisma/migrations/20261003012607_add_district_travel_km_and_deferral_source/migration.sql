-- AlterTable
ALTER TABLE "deferrals" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'AUTO';

-- AlterTable
ALTER TABLE "district_travel" ADD COLUMN     "depot_to_district_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "inter_stop_km" DOUBLE PRECISION NOT NULL DEFAULT 0;
