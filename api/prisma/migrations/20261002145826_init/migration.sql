-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STORE_MANAGER', 'DISPATCHER', 'LOADER', 'DRIVER');

-- CreateEnum
CREATE TYPE "DockType" AS ENUM ('REAR_DOCK', 'CURB', 'MALL_BAY');

-- CreateEnum
CREATE TYPE "ParkingConstraint" AS ENUM ('NONE', 'VAN_ONLY');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('TRUCK', 'VAN');

-- CreateEnum
CREATE TYPE "TemperatureType" AS ENUM ('REEFER', 'AMBIENT');

-- CreateEnum
CREATE TYPE "TempRequirement" AS ENUM ('CHILLED', 'FROZEN', 'AMBIENT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'PLANNED', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'DEFERRED', 'AT_RISK');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PLANNED', 'RELEASED', 'LOADING', 'READY', 'IN_TRANSIT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('PENDING', 'ARRIVED', 'COMPLETED', 'ISSUE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "depot" TEXT,
    "outlet_id" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outlets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "depot" TEXT NOT NULL,
    "dock_type" "DockType" NOT NULL,
    "parking_constraint" "ParkingConstraint" NOT NULL DEFAULT 'NONE',
    "mall_window_open" TEXT,
    "mall_window_close" TEXT,
    "window_open" TEXT NOT NULL,
    "window_close" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outlets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "registration_no" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "temperature_type" "TemperatureType" NOT NULL,
    "max_weight_kg" DOUBLE PRECISION NOT NULL,
    "max_volume_m3" DOUBLE PRECISION NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "km_per_l" DOUBLE PRECISION NOT NULL,
    "weekly_fuel_quota_l" DOUBLE PRECISION NOT NULL,
    "depot" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "depot" TEXT NOT NULL,
    "temperature_requirement" "TempRequirement" NOT NULL,
    "units" INTEGER NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "volume_m3" DOUBLE PRECISION NOT NULL,
    "window_open" TEXT NOT NULL,
    "window_close" TEXT NOT NULL,
    "delivery_date" TIMESTAMP(3) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "trip_number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "brand" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'PLANNED',
    "planned_departure" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stops" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "planned_arrival" TIMESTAMP(3),
    "actual_arrival" TIMESTAMP(3),
    "arrived_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),
    "status" "StopStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_of_delivery" (
    "id" TEXT NOT NULL,
    "stop_id" TEXT NOT NULL,
    "receiver_name" TEXT NOT NULL,
    "signature_note" TEXT NOT NULL,
    "photo_url" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proof_of_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deferrals" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "decided_by" TEXT NOT NULL,
    "decided_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deferrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loading_events" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "loaded_qty" INTEGER NOT NULL,
    "expected_qty" INTEGER NOT NULL,
    "shortfall_flag" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loading_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_events" (
    "id" TEXT NOT NULL,
    "client_uuid" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "payload_json" JSONB NOT NULL,
    "created_offline_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "district_travel" (
    "id" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "depot" TEXT NOT NULL,
    "depot_to_district_freeflow_min" INTEGER NOT NULL,
    "inter_stop_freeflow_min" INTEGER NOT NULL,

    CONSTRAINT "district_travel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_allowance" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "dock_type" "DockType" NOT NULL,
    "service_allowance_min" INTEGER NOT NULL,

    CONSTRAINT "service_allowance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registration_no_key" ON "vehicles"("registration_no");

-- CreateIndex
CREATE UNIQUE INDEX "trips_vehicle_id_date_trip_number_key" ON "trips"("vehicle_id", "date", "trip_number");

-- CreateIndex
CREATE UNIQUE INDEX "proof_of_delivery_stop_id_key" ON "proof_of_delivery"("stop_id");

-- CreateIndex
CREATE UNIQUE INDEX "sync_events_client_uuid_key" ON "sync_events"("client_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "district_travel_district_depot_key" ON "district_travel"("district", "depot");

-- CreateIndex
CREATE UNIQUE INDEX "service_allowance_brand_dock_type_key" ON "service_allowance"("brand", "dock_type");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "trip_stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deferrals" ADD CONSTRAINT "deferrals_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deferrals" ADD CONSTRAINT "deferrals_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_events" ADD CONSTRAINT "loading_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_events" ADD CONSTRAINT "loading_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loading_events" ADD CONSTRAINT "loading_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
