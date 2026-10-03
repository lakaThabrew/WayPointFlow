import { Router } from 'express';
import { createOrder, getMyOrder, listMyOrders, confirmReceipt } from '../controllers/orderController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

export const ordersRouter = Router();

ordersRouter.use(authMiddleware, requireRole('STORE_MANAGER'));
ordersRouter.post('/', createOrder);
ordersRouter.get('/', listMyOrders);
ordersRouter.get('/:id', getMyOrder);
ordersRouter.post('/:id/receipt', confirmReceipt);
