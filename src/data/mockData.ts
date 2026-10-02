import type { Order, Vehicle, Driver, Outlet, Trip, Alert, AppUser } from '../types';

export const VEHICLES: Vehicle[] = [
  { id: 'VEH014', type: 'Reefer Truck', reefer: true, maxWeightKg: 2400, maxVolumeM3: 12, depot: 'Peliyagoda', driver: 'DRV001', status: 'On Route', fuelType: 'Diesel', kmPerLitre: 6.2, weeklyFuelQuotaL: 280, fuelUsedL: 184, plate: 'WP-GA-1847' },
  { id: 'VEH022', type: 'Dry Truck', reefer: false, maxWeightKg: 3000, maxVolumeM3: 15, depot: 'Peliyagoda', driver: 'DRV002', status: 'Loading', fuelType: 'Diesel', kmPerLitre: 5.8, weeklyFuelQuotaL: 260, fuelUsedL: 110, plate: 'WP-GA-2213' },
  { id: 'VEH031', type: 'Reefer Van', reefer: true, maxWeightKg: 800, maxVolumeM3: 4, depot: 'Peliyagoda', driver: 'DRV003', status: 'Available', fuelType: 'Diesel', kmPerLitre: 9.1, weeklyFuelQuotaL: 140, fuelUsedL: 62, plate: 'WP-GA-0914' },
  { id: 'VEH008', type: 'Reefer Truck', reefer: true, maxWeightKg: 2400, maxVolumeM3: 12, depot: 'Kandy', driver: 'DRV004', status: 'On Route', fuelType: 'Diesel', kmPerLitre: 5.9, weeklyFuelQuotaL: 280, fuelUsedL: 220, plate: 'CP-NA-3301' },
  { id: 'VEH017', type: 'Dry Truck', reefer: false, maxWeightKg: 3000, maxVolumeM3: 15, depot: 'Peliyagoda', driver: undefined, status: 'Workshop', fuelType: 'Diesel', kmPerLitre: 5.8, weeklyFuelQuotaL: 260, fuelUsedL: 0, plate: 'WP-GA-1109' },
  { id: 'VEH041', type: 'Ambient Van', reefer: false, maxWeightKg: 800, maxVolumeM3: 4, depot: 'Peliyagoda', driver: 'DRV005', status: 'On Route', fuelType: 'Diesel', kmPerLitre: 10.2, weeklyFuelQuotaL: 120, fuelUsedL: 44, plate: 'WP-GA-5522' },
];

export const DRIVERS: Driver[] = [
  { id: 'DRV001', name: 'Kasun Perera', vehicle: 'VEH014', depot: 'Peliyagoda', phone: '+94 77 234 5678', status: 'On route' },
  { id: 'DRV002', name: 'Nimal Fernando', vehicle: 'VEH022', depot: 'Peliyagoda', phone: '+94 71 456 7890', status: 'On duty' },
  { id: 'DRV003', name: 'Priya Senanayake', vehicle: 'VEH031', depot: 'Peliyagoda', phone: '+94 76 890 1234', status: 'Available' },
  { id: 'DRV004', name: 'Samantha Wickrama', vehicle: 'VEH008', depot: 'Kandy', phone: '+94 77 345 6789', status: 'On route' },
  { id: 'DRV005', name: 'Dilan Rajapaksa', vehicle: 'VEH041', depot: 'Peliyagoda', phone: '+94 71 567 8901', status: 'On route' },
];

export const OUTLETS: Outlet[] = [
  { id: 'OUT032', name: 'Waypoint Fresh Gampaha', brand: 'Fresh', district: 'Gampaha', address: '14 Station Rd, Gampaha', vanOnly: false, mall: false, depot: 'Peliyagoda', openTime: '08:00', windowStart: '05:00', windowEnd: '07:30' },
  { id: 'OUT041', name: 'Waypoint Fresh Colombo 3', brand: 'Fresh', district: 'Colombo', address: '82 Galle Rd, Colombo 3', vanOnly: false, mall: false, depot: 'Peliyagoda', openTime: '08:00', windowStart: '05:30', windowEnd: '07:30' },
  { id: 'OUT047', name: 'Waypoint Fresh Kelaniya', brand: 'Fresh', district: 'Gampaha', address: '3B Market St, Kelaniya', vanOnly: true, mall: false, depot: 'Peliyagoda', openTime: '08:00', windowStart: '05:30', windowEnd: '07:30' },
  { id: 'OUT052', name: 'Waypoint Style Majestic City', brand: 'Style', district: 'Colombo', address: 'Level 2, Majestic City, Bambalapitiya', vanOnly: false, mall: true, depot: 'Peliyagoda', openTime: '10:00', windowStart: '10:00', windowEnd: '12:00' },
  { id: 'OUT063', name: 'Waypoint Tech Nugegoda', brand: 'Tech', district: 'Colombo', address: '27 High Level Rd, Nugegoda', vanOnly: false, mall: false, depot: 'Peliyagoda', openTime: '09:30', windowStart: '09:00', windowEnd: '13:00' },
  { id: 'OUT078', name: 'Waypoint Fresh Negombo', brand: 'Fresh', district: 'Gampaha', address: '55 Lewis Pl, Negombo', vanOnly: false, mall: false, depot: 'Peliyagoda', openTime: '08:00', windowStart: '05:30', windowEnd: '07:30' },
  { id: 'OUT091', name: 'Waypoint Style One Galle Face', brand: 'Style', district: 'Colombo', address: 'One Galle Face Mall, Level 3', vanOnly: false, mall: true, depot: 'Peliyagoda', openTime: '10:00', windowStart: '08:00', windowEnd: '10:00' },
];

export const ORDERS: Order[] = [
  { id: 'ORD-10482', outlet: 'OUT047', outletName: 'Waypoint Fresh Kelaniya', brand: 'Fresh', district: 'Gampaha', deliveryDate: '2026-09-30', window: '05:30–07:30', temp: 'Chilled', weightKg: 120, volumeM3: 0.6, status: 'Deferred', vehicle: undefined, trip: undefined, vanOnly: true, depot: 'Peliyagoda', packages: 8 },
  { id: 'ORD-10483', outlet: 'OUT032', outletName: 'Waypoint Fresh Gampaha', brand: 'Fresh', district: 'Gampaha', deliveryDate: '2026-09-30', window: '05:00–07:30', temp: 'Chilled', weightKg: 200, volumeM3: 0.9, status: 'In Transit', vehicle: 'VEH014', trip: 1, driver: 'Kasun Perera', plannedArrival: '06:20', actualArrival: '06:42', depot: 'Peliyagoda', packages: 14 },
  { id: 'ORD-10484', outlet: 'OUT041', outletName: 'Waypoint Fresh Colombo 3', brand: 'Fresh', district: 'Colombo', deliveryDate: '2026-09-30', window: '05:30–07:30', temp: 'Ambient', weightKg: 180, volumeM3: 1.2, status: 'In Transit', vehicle: 'VEH014', trip: 1, driver: 'Kasun Perera', plannedArrival: '05:55', actualArrival: '05:58', depot: 'Peliyagoda', packages: 12 },
  { id: 'ORD-10485', outlet: 'OUT052', outletName: 'Waypoint Style Majestic City', brand: 'Style', district: 'Colombo', deliveryDate: '2026-09-30', window: '10:00–12:00', temp: 'Ambient', weightKg: 400, volumeM3: 8.0, status: 'Planned', vehicle: 'VEH022', trip: 1, depot: 'Peliyagoda', packages: 34, mall: true },
  { id: 'ORD-10486', outlet: 'OUT063', outletName: 'Waypoint Tech Nugegoda', brand: 'Tech', district: 'Colombo', deliveryDate: '2026-09-30', window: '09:00–13:00', temp: 'Ambient', weightKg: 350, volumeM3: 3.5, status: 'Confirmed', depot: 'Peliyagoda', packages: 7 },
  { id: 'ORD-10527', outlet: 'OUT032', outletName: 'Waypoint Fresh Gampaha', brand: 'Fresh', district: 'Gampaha', deliveryDate: '2026-09-30', window: '05:00–07:30', temp: 'Chilled', weightKg: 160, volumeM3: 0.7, status: 'Delivered', vehicle: 'VEH014', trip: 1, driver: 'Kasun Perera', plannedArrival: '06:20', actualArrival: '06:42', depot: 'Peliyagoda', packages: 11 },
  { id: 'ORD-10489', outlet: 'OUT078', outletName: 'Waypoint Fresh Negombo', brand: 'Fresh', district: 'Gampaha', deliveryDate: '2026-09-30', window: '05:30–07:30', temp: 'Chilled', weightKg: 240, volumeM3: 1.1, status: 'Loading', vehicle: 'VEH014', trip: 2, depot: 'Peliyagoda', packages: 18 },
  { id: 'ORD-10491', outlet: 'OUT091', outletName: 'Waypoint Style One Galle Face', brand: 'Style', district: 'Colombo', deliveryDate: '2026-09-30', window: '08:00–10:00', temp: 'Ambient', weightKg: 520, volumeM3: 10.2, status: 'Confirmed', depot: 'Peliyagoda', packages: 48, mall: true },
  { id: 'ORD-10466', outlet: 'OUT032', outletName: 'Waypoint Fresh Gampaha', brand: 'Fresh', district: 'Gampaha', deliveryDate: '2026-09-29', window: '05:00–07:30', temp: 'Chilled', weightKg: 185, volumeM3: 0.8, status: 'Delivered', vehicle: 'VEH014', trip: 1, driver: 'Kasun Perera', depot: 'Peliyagoda', packages: 13 },
];

export const TRIPS: Trip[] = [
  {
    vehicle: 'VEH014', trip: 1, depot: 'Peliyagoda', district: 'Gampaha / Colombo',
    brand: 'Fresh', orders: ['ORD-10483', 'ORD-10484', 'ORD-10527'],
    departure: '04:10', eta: '07:15', driver: 'Kasun Perera',
    status: 'On Route', weightKg: 540, volumeM3: 2.8, reefer: true,
    stops: ['OUT041', 'OUT032'], currentStop: 'OUT032', completedStops: 1,
  },
  {
    vehicle: 'VEH022', trip: 1, depot: 'Peliyagoda', district: 'Colombo',
    brand: 'Style', orders: ['ORD-10485'],
    departure: '09:00', eta: '11:30', driver: 'Nimal Fernando',
    status: 'Planned', weightKg: 400, volumeM3: 8.0, reefer: false,
    stops: ['OUT052'], completedStops: 0,
  },
  {
    vehicle: 'VEH041', trip: 1, depot: 'Peliyagoda', district: 'Colombo',
    brand: 'Tech', orders: ['ORD-10486'],
    departure: '08:00', eta: '10:00', driver: 'Dilan Rajapaksa',
    status: 'On Route', weightKg: 350, volumeM3: 3.5, reefer: false,
    stops: ['OUT063'], currentStop: 'OUT063', completedStops: 0,
  },
];

export const ALERTS: Alert[] = [
  { id: 'ALT001', type: 'critical', title: 'Fresh delivery at risk', description: 'ORD-10483 to OUT032 — ETA 06:42, window closes 07:30. 48 minutes remaining.', screen: 'dispatcher/live-ops', time: '06:18 AM', read: false },
  { id: 'ALT002', type: 'warning', title: 'Order deferred', description: 'ORD-10482 to OUT047 (Kelaniya) deferred — no reefer van available. Depot: Peliyagoda.', screen: 'dispatcher/deferral', time: '03:54 AM', read: false },
  { id: 'ALT003', type: 'warning', title: 'Vehicle near fuel quota', description: 'VEH008 at 79% of weekly fuel quota. Kandy corridor routes may require adjustment.', time: '05:30 AM', read: true },
  { id: 'ALT004', type: 'operational', title: 'VEH014 departed', description: 'VEH014 (Kasun Perera) departed Peliyagoda depot at 04:13 AM. Trip 1 — 3 stops.', time: '04:13 AM', read: true },
  { id: 'ALT005', type: 'operational', title: 'Loading shortfall reported', description: 'ORD-10489 loaded at 160/240 kg (67%). Shortfall reported by loader. Hold departure pending resolution.', screen: 'loader/shortfall', time: '03:48 AM', read: false },
  { id: 'ALT006', type: 'info', title: 'Kandy hub connectivity', description: 'Hill country corridor reporting intermittent signal. VEH008 may enter offline mode.', time: '05:55 AM', read: true },
  { id: 'ALT007', type: 'info', title: 'Mall window approaching', description: 'OUT052 (Majestic City) access window opens at 10:00. VEH022 departure window: 09:00 latest.', time: '08:10 AM', read: false },
];

export const USERS: Record<string, AppUser> = {
  dispatcher: { id: 'USR001', name: 'Ashan De Silva', role: 'dispatcher', depot: 'Peliyagoda', email: 'ashan@waypoint.lk', phone: '+94 11 234 5678', initials: 'AD' },
  loader: { id: 'USR002', name: 'Ruwini Jayawardena', role: 'loader', depot: 'Peliyagoda', email: 'ruwini@waypoint.lk', phone: '+94 11 234 5682', initials: 'RJ' },
  driver: { id: 'USR003', name: 'Kasun Perera', role: 'driver', depot: 'Peliyagoda', email: 'kasun.p@waypoint.lk', phone: '+94 77 234 5678', initials: 'KP' },
  'store-manager': { id: 'USR004', name: 'Chamari Wickramasinghe', role: 'store-manager', depot: 'OUT032', outlet: 'OUT032', email: 'chamari@waypoint.lk', phone: '+94 33 456 7890', initials: 'CW' },
};

export const DEMO_CREDENTIALS: Record<string, { password: string; role: string }> = {
  'ashan@waypoint.lk': { password: 'demo1234', role: 'dispatcher' },
  'ruwini@waypoint.lk': { password: 'demo1234', role: 'loader' },
  'kasun.p@waypoint.lk': { password: 'demo1234', role: 'driver' },
  'chamari@waypoint.lk': { password: 'demo1234', role: 'store-manager' },
};

export const TODAY = '2026-09-30';
export const TODAY_DISPLAY = 'Tuesday, 30 September 2026';

export const STATS = {
  ordersReceived: 42,
  ordersConfirmed: 38,
  ordersPlanned: 31,
  ordersDeferred: 3,
  vehiclesAvailable: 12,
  vehiclesInUse: 8,
  reeferCapacityPct: 88,
  activeDeliveries: 6,
  atRiskDeliveries: 1,
};
