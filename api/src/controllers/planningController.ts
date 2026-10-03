import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { nextOperatingDay } from '../utils/cutoff';
import { allocate, assessOrderAgainstFleet, type CandidateOrder, type VehicleLite, type TravelFixture } from '../services/allocator';

function parseDateParam(raw: unknown): Date | null {
  if (typeof raw !== 'string' || !raw) return null;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** POST /planning/allocate { date? } — run the 13-rule engine for a day. */
export async function allocatePlan(req: Request, res: Response) {
  const date = parseDateParam(req.body?.date) ?? nextOperatingDay(new Date());
  const result = await allocate(date, req.authUser!.id);
  return res.json(result);
}

/** GET /planning/plan?date= — trips (with stops + orders + vehicle) and deferrals for a day. */
export async function getPlan(req: Request, res: Response) {
  const date = parseDateParam(req.query.date) ?? nextOperatingDay(new Date());
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setDate(dayEnd.getDate() + 1);

  const [trips, deferrals] = await Promise.all([
    prisma.trip.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      orderBy: [{ vehicleId: 'asc' }, { tripNumber: 'asc' }],
      include: {
        vehicle: true,
        stops: { orderBy: { sequence: 'asc' }, include: { order: true, outlet: true } },
      },
    }),
    prisma.deferral.findMany({
      where: { order: { deliveryDate: { gte: dayStart, lt: dayEnd } } },
      include: { order: { include: { outlet: true } } },
      orderBy: { decidedAt: 'desc' },
    }),
  ]);

  return res.json({ date: dayStart, trips, deferrals });
}

/** GET /planning/conflicts?date= — deferred orders with live per-vehicle assessment (D05). */
export async function getConflicts(req: Request, res: Response) {
  const date = parseDateParam(req.query.date) ?? nextOperatingDay(new Date());
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setDate(dayEnd.getDate() + 1);

  const [orders, vehicles, travelRows, allowanceRows] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'DEFERRED', deliveryDate: { lte: dayEnd } },
      include: { outlet: true, deferrals: { orderBy: { decidedAt: 'desc' }, take: 1 } },
      orderBy: { deliveryDate: 'asc' },
    }),
    prisma.vehicle.findMany({ where: { active: true } }),
    prisma.districtTravel.findMany(),
    prisma.serviceAllowance.findMany(),
  ]);

  const allowanceByKey = new Map(allowanceRows.map((a) => [`${a.brand}|${a.dockType}`, a.serviceAllowanceMin]));
  const vehiclesLite: VehicleLite[] = vehicles.map((v) => ({
    id: v.id, registrationNo: v.registrationNo, type: v.type, temperatureType: v.temperatureType,
    maxWeightKg: v.maxWeightKg, maxVolumeM3: v.maxVolumeM3, kmPerL: v.kmPerL,
    weeklyFuelQuotaL: v.weeklyFuelQuotaL, depot: v.depot,
  }));

  const conflicts = orders.map((o) => {
    const travelRow = travelRows.find((t) => t.district === o.district && t.depot === o.depot);
    const candidate: CandidateOrder = {
      id: o.id, outletId: o.outletId, brand: o.brand, district: o.district, depot: o.depot,
      temperatureRequirement: o.temperatureRequirement,
      weightKg: o.weightKg, volumeM3: o.volumeM3,
      windowOpen: o.windowOpen, windowClose: o.windowClose,
      previouslyDeferred: true,
      dockType: o.outlet.dockType,
      vanOnly: o.outlet.parkingConstraint === 'VAN_ONLY',
      mallWindowOpen: o.outlet.mallWindowOpen,
      mallWindowClose: o.outlet.mallWindowClose,
    };
    const travel: TravelFixture | null = travelRow
      ? { freeflowMin: travelRow.depotToDistrictFreeflowMin, interStopMin: travelRow.interStopFreeflowMin, depotKm: travelRow.depotToDistrictKm, interStopKm: travelRow.interStopKm }
      : null;

    return {
      order: { ...o, outlet: o.outlet, deferrals: undefined },
      latestDeferral: o.deferrals[0] ?? null,
      // Recomputed live against the current fleet — deterministic, never stale.
      vehicleAssessment: travel
        ? assessOrderAgainstFleet(candidate, vehiclesLite, travel, (c) => allowanceByKey.get(`${c.brand}|${c.dockType}`) ?? 20)
        : vehiclesLite.map((v) => ({ vehicleId: v.id, failedRule: 'No travel fixture for district' })),
    };
  });

  return res.json({ date: dayStart, conflicts });
}

/** POST /planning/defer/:orderId { reason, notes? } — manual deferral (never auto-deleted). */
export async function deferOrder(req: Request, res: Response) {
  const { reason } = req.body ?? {};
  if (typeof reason !== 'string' || reason.trim().length < 5) {
    return res.status(400).json({ error: 'reason is required (min 5 characters)' });
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['NEW', 'CONFIRMED', 'PLANNED'].includes(order.status)) {
    return res.status(409).json({ error: `Cannot defer an order in status ${order.status}` });
  }

  const lastDef = await prisma.deferral.findFirst({ where: { id: { startsWith: 'DEF-' } }, orderBy: { id: 'desc' } });
  const defNum = (lastDef ? parseInt(lastDef.id.slice(4), 10) : 0) + 1;

  const deferral = await prisma.$transaction(async (tx) => {
    // If the order sits on an uncommitted (PLANNED) trip, pull its stop; drop empty trips.
    const stop = await tx.tripStop.findFirst({ where: { orderId: order.id }, include: { trip: true } });
    if (stop && stop.trip.status === 'PLANNED') {
      await tx.tripStop.delete({ where: { id: stop.id } });
      const remaining = await tx.tripStop.count({ where: { tripId: stop.tripId } });
      if (remaining === 0) await tx.trip.delete({ where: { id: stop.tripId } });
    }

    const created = await tx.deferral.create({
      data: {
        id: `DEF-${String(defNum).padStart(4, '0')}`,
        orderId: order.id,
        reason: reason.trim(),
        decidedBy: req.authUser!.id,
        decidedAt: new Date(),
        source: 'MANUAL',
      },
    });
    await tx.order.update({ where: { id: order.id }, data: { status: 'DEFERRED' } });
    return created;
  });

  return res.status(201).json({ deferral });
}

/** GET /planning/orders — all orders (dispatcher overview), newest first, with current vehicle assignment. */
export async function listAllOrders(_req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      outlet: { select: { id: true, name: true, district: true } },
      tripStops: { include: { trip: { select: { vehicleId: true, tripNumber: true, status: true } } }, take: 1 },
    },
  });
  return res.json({
    orders: orders.map((o) => ({
      ...o,
      outletName: o.outlet.name,
      vehicleId: o.tripStops[0]?.trip.vehicleId ?? null,
      tripStops: undefined,
    })),
  });
}

/** POST /trips/:id/release — PLANNED → RELEASED (hands the trip to the loader queue). */
export async function releaseTrip(req: Request, res: Response) {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status !== 'PLANNED') {
    return res.status(409).json({ error: `Trip is ${trip.status} — only PLANNED trips can be released` });
  }

  const updated = await prisma.trip.update({ where: { id: trip.id }, data: { status: 'RELEASED' } });
  // Orders on the released trip move to LOADING (the loader workflow owns them next).
  await prisma.order.updateMany({
    where: { tripStops: { some: { tripId: trip.id } } },
    data: { status: 'LOADING' },
  });
  return res.json({ trip: updated });
}

/** GET /planning/live-ops — fetches active trips and their sequenced stops for real-time tracking */
export async function getLiveOps(req: Request, res: Response) {
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

  const trips = await prisma.trip.findMany({
    where: {
      date: { gte: dayStart, lt: dayEnd },
      status: { in: ['READY', 'IN_TRANSIT', 'COMPLETED'] }
    },
    include: {
      vehicle: true,
      stops: {
        orderBy: { sequence: 'asc' },
        include: { outlet: true, order: true }
      }
    }
  });

  return res.json({ trips });
}

/** GET /planning/alerts — fetches active issues from drivers */
export async function getAlerts(req: Request, res: Response) {
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  
  const stops = await prisma.tripStop.findMany({
    where: {
      status: 'ISSUE',
      issueAcknowledged: false,
      arrivedAt: { gte: dayStart } // roughly only today's alerts
    },
    include: {
      outlet: true,
      trip: { include: { vehicle: true } },
      order: true
    }
  });

  return res.json({ alerts: stops });
}

/** POST /planning/alerts/:stopId/read — dismisses an alert */
export async function markAlertRead(req: Request, res: Response) {
  try {
    const { stopId } = req.params;
    
    const updated = await prisma.tripStop.update({
      where: { id: stopId },
      data: { issueAcknowledged: true }
    });
    
    return res.json({ success: true, stop: updated });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
}
