import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json({ ok: true, note: 'bootstrap' });
});

export default app;
