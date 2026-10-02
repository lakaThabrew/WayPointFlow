import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

export const planningRouter = Router();

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
