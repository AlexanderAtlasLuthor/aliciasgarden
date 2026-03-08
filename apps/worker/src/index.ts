import { Hono } from 'hono';

import { cors } from './middleware/cors';
import { errors } from './middleware/errors';
import { rateLimit } from './middleware/rateLimit';
import { chatRoutes } from './routes/chat';
import { diagnoseRoutes } from './routes/diagnose';
import { healthRoutes } from './routes/health';
import { plantEventsRoutes } from './routes/plantEvents';
import { plantMeasurementsRoutes } from './routes/plantMeasurements';
import { plantPhotosRoutes } from './routes/plantPhotos';
import { plantsRoutes } from './routes/plants';
import planRoutes from './routes/plan';
import { weatherRoutes } from './routes/weather';
import type { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

app.use('*', errors());
app.use('*', cors());
app.use('*', rateLimit());

app.get('/', (c) => {
  return c.json({ ok: true, note: 'bootstrap' });
});

app.route('/', healthRoutes);
app.route('/', plantsRoutes);
app.route('/', plantEventsRoutes);
app.route('/', plantMeasurementsRoutes);
app.route('/', plantPhotosRoutes);
app.route('/', planRoutes);
app.route('/', chatRoutes);
app.route('/', weatherRoutes);
app.route('/', diagnoseRoutes);

export default app;
