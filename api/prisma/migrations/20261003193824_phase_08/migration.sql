-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "receipt_confirmed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "trip_stops" ADD COLUMN     "issue_acknowledged" BOOLEAN NOT NULL DEFAULT false;
