import { Router } from 'express';
import { releaseTrip } from '../controllers/planningController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

export const tripsRouter = Router();

tripsRouter.post('/:id/release', authMiddleware, requireRole('DISPATCHER'), releaseTrip);
