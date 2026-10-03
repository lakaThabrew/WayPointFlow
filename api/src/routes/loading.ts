import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { getLoadingQueue, getTripManifest, submitLoadingEvent, markTripReady } from '../controllers/loadingController';

export const loadingRouter = Router();

loadingRouter.use(authMiddleware);

loadingRouter.get('/queue', requireRole('LOADER', 'DISPATCHER'), getLoadingQueue);
loadingRouter.get('/trips/:id/manifest', requireRole('LOADER', 'DISPATCHER'), getTripManifest);
loadingRouter.post('/events', requireRole('LOADER'), submitLoadingEvent);
loadingRouter.post('/trips/:id/ready', requireRole('LOADER'), markTripReady);
