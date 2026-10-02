import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { isDeliveryDateAllowed } from '../utils/cutoff';

const TEMP_MAP: Record<string, 'CHILLED' | 'FROZEN' | 'AMBIENT'> = {
  chilled: 'CHILLED', frozen: 'FROZEN', ambient: 'AMBIENT',
  CHILLED: 'CHILLED', FROZEN: 'FROZEN', AMBIENT: 'AMBIENT',
};

/** POST /orders — store manager creates an order for their own outlet. */
export async function createOrder(req: Request, res: Response) {
  const outletId = req.authUser!.outletId;
  if (!outletId) return res.status(400).json({ error: 'Your account is not linked to an outlet' });

  const { brand, tempRequirement, weightKg, volumeM3, units, windowOpen, windowClose, deliveryDate, notes } = req.body ?? {};

  // Validation (TC-3.2, TC-3.3)
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0) {
    return res.status(400).json({ error: 'weightKg must be a positive number' });
  }
  const temp = TEMP_MAP[String(tempRequirement)];
  if (!temp) return res.status(400).json({ error: 'tempRequirement must be CHILLED, FROZEN or AMBIENT' });
  const volume = volumeM3 === undefined ? 0 : Number(volumeM3);
  if (!Number.isFinite(volume) || volume < 0) return res.status(400).json({ error: 'volumeM3 must be ≥ 0' });
  const unitCount = units === undefined ? 0 : Number(units);
  if (!Number.isInteger(unitCount) || unitCount < 0) return res.status(400).json({ error: 'units must be a non-negative integer' });
  if (typeof deliveryDate !== 'string' || !deliveryDate) {
    return res.status(400).json({ error: 'deliveryDate must be YYYY-MM-DD' });
  }
  const date = new Date(`${deliveryDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return res.status(400).json({ error: 'deliveryDate must be YYYY-MM-DD' });
  if (!isDeliveryDateAllowed(date)) {
    return res.status(400).json({ error: 'Delivery date is before the cutoff or not an operating day (Mon–Sat). Choose a later date.' });
  }

  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) return res.status(400).json({ error: 'Linked outlet not found' });

  // Continue the ORD-##### sequence for UI consistency.
  // Seed max is ORD-10491; 10527 is only the fallback for an empty table
  // (matches the ID shown on the design's confirmation screen).
  // Demo-scale: find-then-create can race under concurrent writes — a sequence
  // table is a post-hackathon improvement. (Numeric-safe while all ids share width.)
  const last = await prisma.order.findFirst({ where: { id: { startsWith: 'ORD-' } }, orderBy: { id: 'desc' } });
  const nextNum = (last ? parseInt(last.id.slice(4), 10) : 10527) + 1;

  const order = await prisma.order.create({
    data: {
      id: `ORD-${nextNum}`,
      outletId,
      brand: typeof brand === 'string' && brand ? brand : outlet.brand,
      district: outlet.district,
      depot: outlet.depot,
      temperatureRequirement: temp,
      units: unitCount,
      weightKg: weight,
      volumeM3: volume,
      windowOpen: typeof windowOpen === 'string' && windowOpen ? windowOpen : outlet.windowOpen,
      windowClose: typeof windowClose === 'string' && windowClose ? windowClose : outlet.windowClose,
      deliveryDate: date,
      notes: typeof notes === 'string' && notes ? notes : null,
      createdBy: req.authUser!.id,
      status: 'NEW',
    },
  });

  return res.status(201).json({ order });
}

/** GET /orders — the caller's own outlet only (TC-3.5 store isolation). */
export async function listMyOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { outletId: req.authUser!.outletId ?? '__none__' },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ orders });
}

/** GET /orders/:id — 404 unless the order belongs to the caller's outlet. */
export async function getMyOrder(req: Request, res: Response) {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, outletId: req.authUser!.outletId ?? '__none__' },
    include: {
      tripStops: { include: { trip: { include: { vehicle: true } }, proofOfDelivery: true } },
      deferrals: true,
    },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  return res.json({ order });
}
