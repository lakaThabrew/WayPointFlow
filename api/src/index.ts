import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);

app.listen(PORT, () => {
  console.log(`[api] WaypointFlow API running on http://localhost:${PORT}`);
});

export default app;
