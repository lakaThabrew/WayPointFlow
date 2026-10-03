/**
 * services/allocator.ts — the WaypointFlow constraint engine.
 *
 * Deterministic, greedy, explainable: every order is either packed into a trip
 * or deferred with a human-readable reason plus a per-vehicle failure
 * assessment. Implements the 13 rules from the implementation plan §7 and
 * mirrors the Datathon Task 2B feasibility checker (check_allocation.py):
 * one brand + one district per trip, reefer for chilled/frozen, vans for
 * van-only outlets, ≤2 trips per vehicle per day, 270-min Fresh pre-dawn and
 * 480-min daytime budgets, weekly fuel quota.
 */

import { prisma } from '../lib/prisma';

// ── Constants (mirror check_allocation.py) ────────────────────────────────────

const FRESH_DEPARTURE_MIN = 3 * 60 + 30; // 03:30 — pre-dawn window
const OTHER_DEPARTURE_MIN = 8 * 60;      // 08:00 — daytime window
const FRESH_BUDGET_MIN = 270;
const OTHER_BUDGET_MIN = 480;
const MAX_TRIPS_PER_VEHICLE = 2;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AllocationExplanation {
  orderId: string;
  result: 'ALLOCATED' | 'DEFERRED';
  tripId?: string;
  vehicleId?: string;
  checks: string[];
  vehicleAssessment?: Array<{ vehicleId: string; failedRule: string }>;
}

export interface CandidateOrder {
  id: string;
  outletId: string;
  brand: string;
  district: string;
  depot: string;
  temperatureRequirement: 'CHILLED' | 'FROZEN' | 'AMBIENT';
  weightKg: number;
  volumeM3: number;
  windowOpen: string;
  windowClose: string;
  previouslyDeferred: boolean;
  dockType: 'REAR_DOCK' | 'CURB' | 'MALL_BAY';
  vanOnly: boolean;
  mallWindowOpen: string | null;
  mallWindowClose: string | null;
}

export interface VehicleLite {
  id: string;
  registrationNo: string;
  type: 'TRUCK' | 'VAN';
  temperatureType: 'REEFER' | 'AMBIENT';
  maxWeightKg: number;
  maxVolumeM3: number;
  kmPerL: number;
  weeklyFuelQuotaL: number;
  depot: string;
}

interface WorkingTrip {
  vehicle: VehicleLite;
  brand: string;
  district: string;
  depot: string;
  orders: CandidateOrder[];
  weightKg: number;
  volumeM3: number;
  minutes: number;      // recomputed on every append
  km: number;
  departureMin: number; // resolved at finalize (mall shifts apply)
}

interface VehicleDayState {
  tripsUsed: number;
  freshMinutesUsed: number;
  otherMinutesUsed: number;
  fuelLUsed: number; // demo scope: planned consumption for this day only
}

export interface TravelFixture {
  freeflowMin: number;
  interStopMin: number;
  depotKm: number;
  interStopKm: number;
}

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function toHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

// ── Rule helpers ──────────────────────────────────────────────────────────────

function needsReefer(o: CandidateOrder) {
  return o.temperatureRequirement === 'CHILLED' || o.temperatureRequirement === 'FROZEN';
}

function isFresh(brand: string) {
  return brand === 'Fresh';
}

function budgetFor(brand: string) {
  return isFresh(brand) ? FRESH_BUDGET_MIN : OTHER_BUDGET_MIN;
}

function anchorFor(brand: string) {
  return isFresh(brand) ? FRESH_DEPARTURE_MIN : OTHER_DEPARTURE_MIN;
}

export type AllowanceFn = (o: Pick<CandidateOrder, 'brand' | 'dockType'>) => number;

/** Rule 9 — trip minutes: freeflow + (n−1)·inter-stop + Σ service allowances. */
export function tripMinutes(orders: Array<Pick<CandidateOrder, 'brand' | 'dockType'>>, travel: TravelFixture, allowance: AllowanceFn): number {
  if (orders.length === 0) return 0;
  const service = orders.reduce((s, o) => s + allowance(o), 0);
  return travel.freeflowMin + (orders.length - 1) * travel.interStopMin + service;
}

function tripKm(orderCount: number, travel: TravelFixture): number {
  return travel.depotKm + (orderCount - 1) * travel.interStopKm;
}

/**
 * Rule 8 — mall access windows. Returns the departure minute the trip must use,
 * or null if no departure satisfies every mall stop. Fresh trips keep their
 * pre-dawn anchor; daytime trips may shift later so a mall arrival lands inside
 * its window.
 */
function departureForTrip(orders: CandidateOrder[], travel: TravelFixture, allowance: AllowanceFn, anchor: number): number | null {
  let departure = anchor;
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    if (!o.mallWindowOpen || !o.mallWindowClose) continue;
    const travelToI = travel.freeflowMin + i * travel.interStopMin + orders.slice(0, i).reduce((s, x) => s + allowance(x), 0);
    const arrival = departure + travelToI;
    const open = toMin(o.mallWindowOpen);
    const close = toMin(o.mallWindowClose);
    if (arrival > close) return null;            // too late — unfixable
    if (arrival < open) {
      if (isFresh(o.brand)) return null;         // Fresh anchor cannot shift
      departure = open - travelToI;              // daytime: shift later
    }
  }
  return departure;
}

/** First failing rule for (order, optional existing trip, vehicle), or null. */
function firstFailedRule(
  order: CandidateOrder,
  trip: WorkingTrip | null,
  vehicle: VehicleLite,
  state: VehicleDayState,
  travel: TravelFixture,
  allowance: AllowanceFn,
): string | null {
  // Rule 3 — temperature
  if (needsReefer(order) && vehicle.temperatureType !== 'REEFER') return 'No reefer capability';
  // Rule 7 — van-only access
  if (order.vanOnly && vehicle.type !== 'VAN') return 'Not a van (van-only outlet)';
  // Rules 1/2 — cumulative capacity
  if ((trip?.weightKg ?? 0) + order.weightKg > vehicle.maxWeightKg) return 'Weight capacity exceeded';
  if ((trip?.volumeM3 ?? 0) + order.volumeM3 > vehicle.maxVolumeM3) return 'Volume capacity exceeded';

  const ordersWith = [...(trip?.orders ?? []), order];
  const newMinutes = tripMinutes(ordersWith, travel, allowance);
  // Rule 9 — trip-level time budget
  if (newMinutes > budgetFor(order.brand)) return 'Trip time budget exceeded';
  // Rules 10/11 — per-vehicle daily budget (replace the trip's current minutes, then add new)
  const dailyUsed = isFresh(order.brand) ? state.freshMinutesUsed : state.otherMinutesUsed;
  const dailyAfter = dailyUsed - (trip?.minutes ?? 0) + newMinutes;
  if (dailyAfter > budgetFor(order.brand)) return 'Daily budget exhausted';
  // Rule 8 — mall window (with daytime departure shift)
  if (departureForTrip(ordersWith, travel, allowance, anchorFor(order.brand)) === null) return 'Mall access window cannot be met';
  // Rule 12 — fuel quota (replace trip's current km, then add new)
  const fuelAfter = state.fuelLUsed - (trip ? trip.km / vehicle.kmPerL : 0) + tripKm(ordersWith.length, travel) / vehicle.kmPerL;
  if (fuelAfter > vehicle.weeklyFuelQuotaL) return 'Weekly fuel quota exceeded';

  return null;
}

/** Live per-vehicle assessment for the conflict screen (deterministic recompute, base capability checks). */
export function assessOrderAgainstFleet(
  order: CandidateOrder,
  vehicles: VehicleLite[],
  travel: TravelFixture,
  allowance: AllowanceFn,
): Array<{ vehicleId: string; failedRule: string }> {
  return vehicles.map((v) => ({
    vehicleId: v.id,
    failedRule: firstFailedRule(order, null, v, { tripsUsed: 0, freshMinutesUsed: 0, otherMinutesUsed: 0, fuelLUsed: 0 }, travel, allowance) ?? 'Feasible',
  }));
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function allocate(date: Date, dispatcherId: string) {
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setDate(dayEnd.getDate() + 1);

  // 1. Idempotency: drop this date's uncommitted (PLANNED) trips and AUTO deferrals.
  await prisma.$transaction(async (tx) => {
    const staleTrips = await tx.trip.findMany({
      where: { date: { gte: dayStart, lt: dayEnd }, status: 'PLANNED' },
      include: { stops: { select: { orderId: true } } },
    });
    const staleTripIds = staleTrips.map((t) => t.id);
    const staleOrderIds = staleTrips.flatMap((t) => t.stops.map((s) => s.orderId));
    await tx.tripStop.deleteMany({ where: { tripId: { in: staleTripIds } } });
    await tx.trip.deleteMany({ where: { id: { in: staleTripIds } } });
    // Orders from the discarded plan go back to CONFIRMED so they re-enter the queue —
    // except manually-deferred ones, which return to DEFERRED (a dispatcher parked them).
    await tx.order.updateMany({
      where: { id: { in: staleOrderIds }, deferrals: { none: { source: 'MANUAL' } } },
      data: { status: 'CONFIRMED' },
    });
    await tx.order.updateMany({
      where: { id: { in: staleOrderIds }, deferrals: { some: { source: 'MANUAL' } } },
      data: { status: 'DEFERRED' },
    });
    // AUTO deferrals from prior runs of this date are removed; MANUAL ones stay.
    await tx.deferral.deleteMany({ where: { source: 'AUTO', order: { deliveryDate: { gte: dayStart, lt: dayEnd } } } });
    await tx.order.updateMany({
      where: { status: 'DEFERRED', deliveryDate: { gte: dayStart, lt: dayEnd }, deferrals: { none: { source: 'MANUAL' } } },
      data: { status: 'CONFIRMED' },
    });
  });

  // 2. Load inputs
  const [rawOrders, vehicles, travelRows, allowanceRows, committedTrips] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          // Due today or overdue (a re-run reverts PLANNED orders to CONFIRMED with
          // their original — possibly past — deliveryDate; they must stay candidates).
          // Manually-deferred (parked) orders are never candidates.
          { status: 'CONFIRMED', deliveryDate: { lt: dayEnd }, deferrals: { none: { source: 'MANUAL' } } },
          // Carry-over deferrals — previously skipped outlets come first.
          { status: 'DEFERRED', deliveryDate: { lte: dayEnd }, deferrals: { none: { source: 'MANUAL' } } },
        ],
      },
      include: { outlet: true, deferrals: { select: { id: true } } },
    }),
    prisma.vehicle.findMany({ where: { active: true } }),
    prisma.districtTravel.findMany(),
    prisma.serviceAllowance.findMany(),
    prisma.trip.findMany({
      where: { date: { gte: dayStart, lt: dayEnd }, status: { not: 'PLANNED' } },
      include: { stops: { include: { order: { include: { outlet: true } } } } },
    }),
  ]);

  const travelByKey = new Map(travelRows.map((t) => [`${t.district}|${t.depot}`, {
    freeflowMin: t.depotToDistrictFreeflowMin,
    interStopMin: t.interStopFreeflowMin,
    depotKm: t.depotToDistrictKm,
    interStopKm: t.interStopKm,
  } satisfies TravelFixture]));
  const allowanceByKey = new Map(allowanceRows.map((a) => [`${a.brand}|${a.dockType}`, a.serviceAllowanceMin]));
  const allowanceFor: AllowanceFn = (o) => allowanceByKey.get(`${o.brand}|${o.dockType}`) ?? 20;

  const candidates: CandidateOrder[] = rawOrders.map((o) => ({
    id: o.id,
    outletId: o.outletId,
    brand: o.brand,
    district: o.district,
    depot: o.depot,
    temperatureRequirement: o.temperatureRequirement,
    weightKg: o.weightKg,
    volumeM3: o.volumeM3,
    windowOpen: o.windowOpen,
    windowClose: o.windowClose,
    previouslyDeferred: o.deferrals.length > 0,
    dockType: o.outlet.dockType,
    vanOnly: o.outlet.parkingConstraint === 'VAN_ONLY',
    mallWindowOpen: o.outlet.mallWindowOpen,
    mallWindowClose: o.outlet.mallWindowClose,
  }));

  // Priority: previously deferred → Fresh first → tightest window
  candidates.sort((a, b) =>
    Number(b.previouslyDeferred) - Number(a.previouslyDeferred)
    || Number(isFresh(b.brand)) - Number(isFresh(a.brand))
    || a.windowClose.localeCompare(b.windowClose),
  );

  // Per-vehicle day state — committed (released/etc.) trips count toward limits and budgets
  const dayState = new Map<string, VehicleDayState>(
    vehicles.map((v) => [v.id, { tripsUsed: 0, freshMinutesUsed: 0, otherMinutesUsed: 0, fuelLUsed: 0 }]),
  );
  for (const t of committedTrips) {
    const st = dayState.get(t.vehicleId);
    if (!st) continue;
    st.tripsUsed += 1;
    const travel = travelByKey.get(`${t.district}|${t.stops[0]?.order.depot ?? 'Peliyagoda'}`);
    if (travel && t.stops.length > 0) {
      const mins = tripMinutes(t.stops.map((s) => ({ brand: t.brand, dockType: s.order.outlet.dockType })), travel, allowanceFor);
      if (isFresh(t.brand)) st.freshMinutesUsed += mins; else st.otherMinutesUsed += mins;
      const v = vehicles.find((x) => x.id === t.vehicleId);
      if (v) st.fuelLUsed += tripKm(t.stops.length, travel) / v.kmPerL;
    }
  }

  // 3. Greedy allocation per (brand, district) group
  const groups = new Map<string, CandidateOrder[]>();
  for (const o of candidates) {
    const key = `${o.brand}|${o.district}`;
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }

  const explanations: AllocationExplanation[] = [];
  const newTrips: WorkingTrip[] = [];
  const deferred: Array<{ order: CandidateOrder; reason: string; assessment: Array<{ vehicleId: string; failedRule: string }> }> = [];
  const vehiclesAsc = [...vehicles].sort((a, b) => a.maxWeightKg - b.maxWeightKg);

  for (const [key, orders] of groups) {
    const [brand, district] = key.split('|');
    const travel = travelByKey.get(`${district}|${orders[0].depot}`);
    if (!travel) {
      for (const o of orders) {
        deferred.push({ order: o, reason: `No travel fixture for district ${district}`, assessment: [] });
        explanations.push({ orderId: o.id, result: 'DEFERRED', checks: [`No travel fixture for district ${district}`] });
      }
      continue;
    }
    const openTrips: WorkingTrip[] = [];

    for (const order of orders) {
      let placedTrip: WorkingTrip | null = null;
      const failures: Array<{ vehicleId: string; failedRule: string }> = [];

      // Pass 1 — append to an open trip (best-fit packing)
      for (const trip of openTrips) {
        const st = dayState.get(trip.vehicle.id)!;
        const rule = firstFailedRule(order, trip, trip.vehicle, st, travel, allowanceFor);
        if (!rule) { placedTrip = trip; break; }
        failures.push({ vehicleId: trip.vehicle.id, failedRule: rule });
      }

      // Pass 2 — open a new trip on the smallest feasible vehicle
      if (!placedTrip) {
        for (const v of vehiclesAsc) {
          const st = dayState.get(v.id)!;
          if (st.tripsUsed >= MAX_TRIPS_PER_VEHICLE) {
            failures.push({ vehicleId: v.id, failedRule: 'Trip limit (2/day)' });
            continue;
          }
          const rule = firstFailedRule(order, null, v, st, travel, allowanceFor);
          if (!rule) {
            const trip: WorkingTrip = {
              vehicle: v, brand, district, depot: order.depot,
              orders: [], weightKg: 0, volumeM3: 0, minutes: 0, km: 0,
              departureMin: anchorFor(brand),
            };
            openTrips.push(trip);
            newTrips.push(trip);
            st.tripsUsed += 1;
            placedTrip = trip;
            break;
          }
          failures.push({ vehicleId: v.id, failedRule: rule });
        }
      }

      if (placedTrip) {
        // Apply the append: update trip totals and the vehicle's daily budget/fuel (delta)
        const before = placedTrip.minutes;
        const beforeKm = placedTrip.km;
        placedTrip.orders.push(order);
        placedTrip.weightKg += order.weightKg;
        placedTrip.volumeM3 += order.volumeM3;
        placedTrip.minutes = tripMinutes(placedTrip.orders, travel, allowanceFor);
        placedTrip.km = tripKm(placedTrip.orders.length, travel);

        const st = dayState.get(placedTrip.vehicle.id)!;
        if (isFresh(brand)) st.freshMinutesUsed += placedTrip.minutes - before;
        else st.otherMinutesUsed += placedTrip.minutes - before;
        st.fuelLUsed += (placedTrip.km - beforeKm) / placedTrip.vehicle.kmPerL;

        explanations.push({
          orderId: order.id,
          result: 'ALLOCATED',
          vehicleId: placedTrip.vehicle.id,
          checks: [
            `${needsReefer(order) ? 'Reefer required' : 'Ambient goods'} — ${placedTrip.vehicle.temperatureType === 'REEFER' ? 'reefer-capable' : 'ambient vehicle'} ✓`,
            `Weight ${placedTrip.weightKg}/${placedTrip.vehicle.maxWeightKg} kg ✓`,
            `Volume ${placedTrip.volumeM3}/${placedTrip.vehicle.maxVolumeM3} m³ ✓`,
            `Trip time ${placedTrip.minutes} min ≤ ${budgetFor(brand)} min ✓`,
            ...(order.vanOnly ? ['Van-only outlet — assigned to a van ✓'] : []),
            ...(order.mallWindowOpen ? [`Mall window ${order.mallWindowOpen}–${order.mallWindowClose} satisfied ✓`] : []),
            `Fuel quota ok ✓`,
          ],
        });
      } else {
        const counts = new Map<string, number>();
        for (const f of failures) counts.set(f.failedRule, (counts.get(f.failedRule) ?? 0) + 1);
        const headline = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No compatible vehicle';
        const reason = `${headline} — ${failures.map((f) => `${f.vehicleId}: ${f.failedRule}`).join('; ')}`;
        deferred.push({ order, reason, assessment: failures });
        explanations.push({ orderId: order.id, result: 'DEFERRED', checks: [reason], vehicleAssessment: failures });
      }
    }
  }

  // 4. Persist (single transaction)
  const lastTrip = await prisma.trip.findFirst({ where: { id: { startsWith: 'TRIP-' } }, orderBy: { id: 'desc' } });
  let nextTripNum = (lastTrip ? parseInt(lastTrip.id.slice(5), 10) : 0) + 1;

  interface PersistedTrip { id: string; working: WorkingTrip; tripNumber: number }
  const persisted: PersistedTrip[] = await prisma.$transaction(async (tx) => {
    const out: PersistedTrip[] = [];
    const tripCountByVehicle = new Map<string, number>();
    for (const t of committedTrips) {
      tripCountByVehicle.set(t.vehicleId, (tripCountByVehicle.get(t.vehicleId) ?? 0) + 1);
    }

    for (const wt of newTrips) {
      const travel = travelByKey.get(`${wt.district}|${wt.depot}`)!;
      const departure = departureForTrip(wt.orders, travel, allowanceFor, anchorFor(wt.brand))!;
      wt.departureMin = departure;
      const tripNumber = (tripCountByVehicle.get(wt.vehicle.id) ?? 0) + 1;
      tripCountByVehicle.set(wt.vehicle.id, tripNumber);

      const departureDate = new Date(dayStart);
      departureDate.setMinutes(departure);
      const tripId = `TRIP-${String(nextTripNum++).padStart(4, '0')}`;

      await tx.trip.create({
        data: {
          id: tripId,
          vehicleId: wt.vehicle.id,
          tripNumber,
          date: dayStart,
          brand: wt.brand,
          district: wt.district,
          status: 'PLANNED',
          plannedDeparture: departureDate,
        },
      });

      for (let i = 0; i < wt.orders.length; i++) {
        const o = wt.orders[i];
        const arrival = new Date(dayStart);
        arrival.setMinutes(
          departure + travel.freeflowMin + i * travel.interStopMin
          + wt.orders.slice(0, i).reduce((s, x) => s + allowanceFor(x), 0),
        );
        await tx.tripStop.create({
          data: { tripId, orderId: o.id, outletId: o.outletId, sequence: i + 1, plannedArrival: arrival },
        });
        await tx.order.update({ where: { id: o.id }, data: { status: 'PLANNED' } });
        const ex = explanations.find((e) => e.orderId === o.id);
        if (ex) ex.tripId = tripId;
      }
      out.push({ id: tripId, working: wt, tripNumber });
    }

    for (const d of deferred) {
      await tx.order.update({ where: { id: d.order.id }, data: { status: 'DEFERRED' } });
      const lastDef = await tx.deferral.findFirst({ where: { id: { startsWith: 'DEF-' } }, orderBy: { id: 'desc' } });
      const defNum = (lastDef ? parseInt(lastDef.id.slice(4), 10) : 0) + 1;
      await tx.deferral.create({
        data: {
          id: `DEF-${String(defNum).padStart(4, '0')}`,
          orderId: d.order.id,
          reason: d.reason,
          decidedBy: dispatcherId,
          decidedAt: new Date(),
          source: 'AUTO',
        },
      });
    }

    return out;
  });

  // 5. Response payload
  const tripsOut = persisted.map(({ id, working: wt, tripNumber }) => {
    const travel = travelByKey.get(`${wt.district}|${wt.depot}`)!;
    return {
      id,
      vehicleId: wt.vehicle.id,
      registrationNo: wt.vehicle.registrationNo,
      tripNumber,
      brand: wt.brand,
      district: wt.district,
      status: 'PLANNED',
      departure: toHHMM(wt.departureMin),
      tripMinutes: wt.minutes,
      routeKm: wt.km,
      weightKg: wt.weightKg,
      volumeM3: wt.volumeM3,
      maxWeightKg: wt.vehicle.maxWeightKg,
      maxVolumeM3: wt.vehicle.maxVolumeM3,
      temperatureType: wt.vehicle.temperatureType,
      vehicleType: wt.vehicle.type,
      stops: wt.orders.map((o, i) => ({ orderId: o.id, outletId: o.outletId, sequence: i + 1 })),
    };
  });

  return {
    date: dayStart,
    trips: tripsOut,
    deferred: deferred.map((d) => ({ orderId: d.order.id, outletId: d.order.outletId, reason: d.reason, vehicleAssessment: d.assessment })),
    explanations,
    summary: {
      candidates: candidates.length,
      allocated: explanations.filter((e) => e.result === 'ALLOCATED').length,
      deferred: deferred.length,
      trips: tripsOut.length,
      vehiclesUsed: new Set(tripsOut.map((t) => t.vehicleId)).size,
    },
  };
}
