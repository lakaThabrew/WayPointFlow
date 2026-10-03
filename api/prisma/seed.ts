/**
 * prisma/seed.ts — WaypointFlow demo seed (EchoBinary, Tech-Triathlon 2026)
 *
 * Mirrors the approved design story: Fresh/Style/Tech brands, Peliyagoda depot,
 * and the UI's outlet/vehicle/order identities (OUT032, VEH014, ORD-10482 …).
 * Safe to re-run: every record is an upsert keyed by a deterministic id.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PLANNING_DAY = new Date('2026-10-01T00:00:00Z');   // tomorrow's orders
const PRIOR_DAY = new Date('2026-09-29T00:00:00Z');      // completed + deferred history

async function main() {
  const passwordHash = bcrypt.hashSync('demo1234', 10);

  // ─── Users (4) ──────────────────────────────────────────────────────────────
  const ashan = await prisma.user.upsert({
    where: { email: 'ashan@waypoint.lk' },
    update: {},
    create: {
      id: 'USR001', email: 'ashan@waypoint.lk', passwordHash,
      role: 'DISPATCHER', name: 'Ashan De Silva', depot: 'Peliyagoda', phone: '+94 11 234 5678',
    },
  });
  const ruwini = await prisma.user.upsert({
    where: { email: 'ruwini@waypoint.lk' },
    update: {},
    create: {
      id: 'USR002', email: 'ruwini@waypoint.lk', passwordHash,
      role: 'LOADER', name: 'Ruwini Jayawardena', depot: 'Peliyagoda', phone: '+94 11 234 5682',
    },
  });
  await prisma.user.upsert({
    where: { email: 'kasun.p@waypoint.lk' },
    update: {},
    create: {
      id: 'USR003', email: 'kasun.p@waypoint.lk', passwordHash,
      role: 'DRIVER', name: 'Kasun Perera', depot: 'Peliyagoda', phone: '+94 77 234 5678',
    },
  });
  await prisma.user.upsert({
    where: { email: 'chamari@waypoint.lk' },
    update: {},
    create: {
      id: 'USR004', email: 'chamari@waypoint.lk', passwordHash,
      role: 'STORE_MANAGER', name: 'Chamari Wickramasinghe', outletId: 'OUT032', phone: '+94 33 456 7890',
    },
  });
  // Second store manager — test fixture for store-isolation TCs (TC-3.5 / TC-3.8).
  await prisma.user.upsert({
    where: { email: 'tharindu@waypoint.lk' },
    update: {},
    create: {
      id: 'USR005', email: 'tharindu@waypoint.lk', passwordHash,
      role: 'STORE_MANAGER', name: 'Tharindu Bandara', outletId: 'OUT041', phone: '+94 11 456 7890',
    },
  });
  console.log('✅ 5 users created');

  // ─── Outlets (5) ────────────────────────────────────────────────────────────
  const outlets = [
    { id: 'OUT032', name: 'Waypoint Fresh Gampaha', brand: 'Fresh', district: 'Gampaha', depot: 'Peliyagoda', dockType: 'REAR_DOCK' as const, parkingConstraint: 'NONE' as const, windowOpen: '05:00', windowClose: '07:30' },
    { id: 'OUT041', name: 'Waypoint Fresh Colombo 3', brand: 'Fresh', district: 'Colombo', depot: 'Peliyagoda', dockType: 'REAR_DOCK' as const, parkingConstraint: 'NONE' as const, windowOpen: '05:30', windowClose: '07:30' },
    { id: 'OUT063', name: 'Waypoint Tech Nugegoda', brand: 'Tech', district: 'Colombo', depot: 'Peliyagoda', dockType: 'REAR_DOCK' as const, parkingConstraint: 'NONE' as const, windowOpen: '09:00', windowClose: '13:00' },
    { id: 'OUT047', name: 'Waypoint Fresh Kelaniya', brand: 'Fresh', district: 'Gampaha', depot: 'Peliyagoda', dockType: 'CURB' as const, parkingConstraint: 'VAN_ONLY' as const, windowOpen: '05:30', windowClose: '07:30' },
    { id: 'OUT052', name: 'Waypoint Style Majestic City', brand: 'Style', district: 'Colombo', depot: 'Peliyagoda', dockType: 'MALL_BAY' as const, parkingConstraint: 'NONE' as const, mallWindowOpen: '10:00', mallWindowClose: '12:00', windowOpen: '10:00', windowClose: '12:00' },
  ];
  for (const o of outlets) {
    await prisma.outlet.upsert({ where: { id: o.id }, update: {}, create: o });
  }
  console.log('✅ 5 outlets created');

  // ─── Vehicles (4) ───────────────────────────────────────────────────────────
  const vehicles = [
    { id: 'VEH022', registrationNo: 'WP-GA-2213', type: 'TRUCK' as const, temperatureType: 'AMBIENT' as const, maxWeightKg: 3000, maxVolumeM3: 15, fuelType: 'Diesel', kmPerL: 5.8, weeklyFuelQuotaL: 260, depot: 'Peliyagoda' },
    { id: 'VEH014', registrationNo: 'WP-GA-1847', type: 'TRUCK' as const, temperatureType: 'REEFER' as const, maxWeightKg: 2400, maxVolumeM3: 12, fuelType: 'Diesel', kmPerL: 6.2, weeklyFuelQuotaL: 280, depot: 'Peliyagoda' },
    { id: 'VEH041', registrationNo: 'WP-GA-5522', type: 'VAN' as const, temperatureType: 'AMBIENT' as const, maxWeightKg: 800, maxVolumeM3: 4, fuelType: 'Diesel', kmPerL: 10.2, weeklyFuelQuotaL: 120, depot: 'Peliyagoda' },
    { id: 'VEH031', registrationNo: 'WP-GA-0914', type: 'VAN' as const, temperatureType: 'REEFER' as const, maxWeightKg: 800, maxVolumeM3: 4, fuelType: 'Diesel', kmPerL: 9.1, weeklyFuelQuotaL: 140, depot: 'Peliyagoda' },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.upsert({ where: { id: v.id }, update: {}, create: v });
  }
  console.log('✅ 4 vehicles created');

  // ─── Reference fixtures ─────────────────────────────────────────────────────
  const districtTravel = [
    { district: 'Gampaha', depot: 'Peliyagoda', depotToDistrictFreeflowMin: 35, interStopFreeflowMin: 15, depotToDistrictKm: 12, interStopKm: 4 },
    { district: 'Colombo', depot: 'Peliyagoda', depotToDistrictFreeflowMin: 30, interStopFreeflowMin: 15, depotToDistrictKm: 15, interStopKm: 5 },
  ];
  for (const d of districtTravel) {
    await prisma.districtTravel.upsert({
      where: { district_depot: { district: d.district, depot: d.depot } },
      update: { depotToDistrictKm: d.depotToDistrictKm, interStopKm: d.interStopKm },
      create: d,
    });
  }
  console.log('✅ 2 district_travel rows created');

  const allowances = [
    { brand: 'Fresh', dockType: 'REAR_DOCK' as const, serviceAllowanceMin: 20 },
    { brand: 'Fresh', dockType: 'CURB' as const, serviceAllowanceMin: 30 },
    { brand: 'Style', dockType: 'MALL_BAY' as const, serviceAllowanceMin: 45 },
    { brand: 'Style', dockType: 'REAR_DOCK' as const, serviceAllowanceMin: 25 },
    { brand: 'Tech', dockType: 'REAR_DOCK' as const, serviceAllowanceMin: 25 },
  ];
  for (const a of allowances) {
    await prisma.serviceAllowance.upsert({
      where: { brand_dockType: { brand: a.brand, dockType: a.dockType } },
      update: {},
      create: a,
    });
  }
  console.log('✅ 5 service_allowance rows created');

  // ─── Orders (8: 6 NEW, 1 DEFERRED, 1 DELIVERED) ─────────────────────────────
  const orders = [
    { id: 'ORD-10483', outletId: 'OUT032', brand: 'Fresh', district: 'Gampaha', depot: 'Peliyagoda', temperatureRequirement: 'CHILLED' as const, units: 14, weightKg: 200, volumeM3: 0.9, windowOpen: '05:00', windowClose: '07:30', deliveryDate: PLANNING_DAY, status: 'NEW' as const },
    { id: 'ORD-10486', outletId: 'OUT063', brand: 'Tech', district: 'Colombo', depot: 'Peliyagoda', temperatureRequirement: 'AMBIENT' as const, units: 7, weightKg: 350, volumeM3: 3.5, windowOpen: '09:00', windowClose: '13:00', deliveryDate: PLANNING_DAY, status: 'NEW' as const },
    { id: 'ORD-10484', outletId: 'OUT041', brand: 'Fresh', district: 'Colombo', depot: 'Peliyagoda', temperatureRequirement: 'CHILLED' as const, units: 12, weightKg: 180, volumeM3: 1.2, windowOpen: '05:30', windowClose: '07:30', deliveryDate: PLANNING_DAY, status: 'NEW' as const },
    { id: 'ORD-10491', outletId: 'OUT052', brand: 'Style', district: 'Colombo', depot: 'Peliyagoda', temperatureRequirement: 'AMBIENT' as const, units: 48, weightKg: 3200, volumeM3: 16, windowOpen: '10:00', windowClose: '12:00', deliveryDate: PLANNING_DAY, status: 'NEW' as const }, // capacity conflict demo — exceeds VEH022 (3000 kg / 15 m³)
    { id: 'ORD-10482', outletId: 'OUT047', brand: 'Fresh', district: 'Gampaha', depot: 'Peliyagoda', temperatureRequirement: 'CHILLED' as const, units: 8, weightKg: 120, volumeM3: 0.6, windowOpen: '05:30', windowClose: '07:30', deliveryDate: PLANNING_DAY, status: 'NEW' as const }, // van-only outlet demo
    { id: 'ORD-10485', outletId: 'OUT052', brand: 'Style', district: 'Colombo', depot: 'Peliyagoda', temperatureRequirement: 'AMBIENT' as const, units: 34, weightKg: 400, volumeM3: 8, windowOpen: '10:00', windowClose: '12:00', deliveryDate: PLANNING_DAY, status: 'NEW' as const }, // mall window demo
    { id: 'ORD-10466', outletId: 'OUT032', brand: 'Fresh', district: 'Gampaha', depot: 'Peliyagoda', temperatureRequirement: 'CHILLED' as const, units: 13, weightKg: 185, volumeM3: 0.8, windowOpen: '05:00', windowClose: '07:30', deliveryDate: PRIOR_DAY, status: 'DEFERRED' as const },
    // Delivered order — the completed demo trip's stop must reference a DELIVERED order (FK requirement).
    { id: 'ORD-10455', outletId: 'OUT032', brand: 'Fresh', district: 'Gampaha', depot: 'Peliyagoda', temperatureRequirement: 'CHILLED' as const, units: 50, weightKg: 240, volumeM3: 1.1, windowOpen: '05:00', windowClose: '07:30', deliveryDate: PRIOR_DAY, status: 'DELIVERED' as const },
  ];
  for (const o of orders) {
    await prisma.order.upsert({
      where: { id: o.id },
      update: {},
      create: { ...o, createdBy: 'USR004' },
    });
  }
  console.log('✅ 8 orders created (1 DEFERRED, 1 DELIVERED, 6 NEW)');

  // ─── Deferral (reason is mandatory per the challenge booklet) ───────────────
  await prisma.deferral.upsert({
    where: { id: 'DEF-0001' },
    update: {},
    create: {
      id: 'DEF-0001',
      orderId: 'ORD-10466',
      reason: 'No compatible reefer available — all reefer capacity allocated to higher-priority Fresh orders',
      decidedBy: ashan.id,
      decidedAt: new Date('2026-09-29T03:54:00Z'),
    },
  });
  console.log('✅ 1 deferral record created');

  // ─── Completed trip + stop + PoD + loading shortfall ────────────────────────
  await prisma.trip.upsert({
    where: { vehicleId_date_tripNumber: { vehicleId: 'VEH014', date: PRIOR_DAY, tripNumber: 1 } },
    update: {},
    create: {
      id: 'TRIP-0001',
      vehicleId: 'VEH014',
      tripNumber: 1,
      date: PRIOR_DAY,
      brand: 'Fresh',
      district: 'Gampaha',
      status: 'COMPLETED',
      plannedDeparture: new Date('2026-09-29T04:10:00Z'),
    },
  });
  console.log('✅ 1 trip created (COMPLETED)');

  await prisma.tripStop.upsert({
    where: { id: 'STOP-0001' },
    update: {},
    create: {
      id: 'STOP-0001',
      tripId: 'TRIP-0001',
      orderId: 'ORD-10455',
      outletId: 'OUT032',
      sequence: 1,
      plannedArrival: new Date('2026-09-29T06:20:00Z'),
      actualArrival: new Date('2026-09-29T06:42:00Z'),
      arrivedAt: new Date('2026-09-29T06:42:00Z'),
      leftAt: new Date('2026-09-29T07:05:00Z'),
      status: 'COMPLETED',
    },
  });
  console.log('✅ 1 trip_stop created (COMPLETED)');

  await prisma.proofOfDelivery.upsert({
    where: { stopId: 'STOP-0001' },
    update: {},
    create: {
      id: 'POD-0001',
      stopId: 'STOP-0001',
      receiverName: 'Nimal Silva',
      signatureNote: 'Received in good condition',
      recordedAt: new Date('2026-09-29T06:50:00Z'),
      synced: true,
    },
  });
  console.log('✅ 1 proof_of_delivery record created');

  await prisma.loadingEvent.upsert({
    where: { id: 'LE-0001' },
    update: {},
    create: {
      id: 'LE-0001',
      tripId: 'TRIP-0001',
      orderId: 'ORD-10455',
      loadedQty: 45,
      expectedQty: 50,
      shortfallFlag: true,
      createdBy: ruwini.id,
    },
  });
  console.log('✅ 1 loading_event with shortfall_flag=true created');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
