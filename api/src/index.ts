import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { planningRouter } from './routes/planning';
import { ordersRouter } from './routes/orders';
import { tripsRouter } from './routes/trips';
import { loadingRouter } from './routes/loading';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/planning', planningRouter);
app.use('/orders', ordersRouter);
app.use('/trips', tripsRouter);
app.use('/loading', loadingRouter);

app.listen(PORT, () => {
  console.log(`[api] WaypointFlow API running on http://localhost:${PORT}`);
});

export default app;
