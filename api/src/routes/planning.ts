import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { nextOperatingDay } from '../utils/cutoff';
import { allocatePlan, getPlan, getConflicts, deferOrder, listAllOrders } from '../controllers/planningController';

export const planningRouter = Router();

planningRouter.get('/orders', authMiddleware, requireRole('DISPATCHER'), listAllOrders);
planningRouter.post('/allocate', authMiddleware, requireRole('DISPATCHER'), allocatePlan);
planningRouter.get('/plan', authMiddleware, requireRole('DISPATCHER'), getPlan);
planningRouter.get('/conflicts', authMiddleware, requireRole('DISPATCHER'), getConflicts);
planningRouter.post('/defer/:orderId', authMiddleware, requireRole('DISPATCHER'), deferOrder);

// First role-protected business route — proves JWT + role middleware (TC-2.5).
// Full planning/allocation endpoints arrive in Phase 4.
planningRouter.get('/queue', authMiddleware, requireRole('DISPATCHER'), async (_req, res) => {
  const orders = await prisma.order.findMany({
    where: { status: { in: ['NEW', 'CONFIRMED'] } },
    orderBy: { createdAt: 'asc' },
    include: { outlet: { select: { id: true, name: true, district: true } } },
  });
  res.json({ orders });
});

/** POST /planning/close — locks a day's queue: NEW → CONFIRMED.
 *  Body may specify { date: "YYYY-MM-DD" }; defaults to the next operating day. */
planningRouter.post('/close', authMiddleware, requireRole('DISPATCHER'), async (req, res) => {
  const body = req.body ?? {};
  let day: Date;
  if (typeof body.date === 'string' && body.date) {
    day = new Date(`${body.date}T00:00:00`);
    if (Number.isNaN(day.getTime())) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  } else {
    day = nextOperatingDay(new Date());
  }
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(day); end.setDate(end.getDate() + 1);

  const result = await prisma.order.updateMany({
    where: { status: 'NEW', deliveryDate: { gte: start, lt: end } },
    data: { status: 'CONFIRMED' },
  });
  res.json({ closed: result.count, deliveryDate: start });
});
