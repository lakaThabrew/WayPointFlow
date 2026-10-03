import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { getDriverTrips, getTripStops, markStopArrival, completeDelivery, reportIssue } from '../controllers/driverController';

export const driverRouter = Router();

driverRouter.use(authMiddleware);
// Driver endpoints require DRIVER role
driverRouter.use(requireRole('DRIVER'));

driverRouter.get('/trips', getDriverTrips);
driverRouter.get('/trips/:id/stops', getTripStops);
driverRouter.post('/stops/:stopId/arrive', markStopArrival);
driverRouter.post('/stops/:stopId/complete', completeDelivery);
driverRouter.post('/stops/:stopId/issue', reportIssue);
