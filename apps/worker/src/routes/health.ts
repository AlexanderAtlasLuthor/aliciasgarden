import { Hono } from 'hono';

import { jsonOk } from '../lib/http';
import type { Env } from '../types/env';

export const healthRoutes = new Hono<{ Bindings: Env }>();

healthRoutes.get('/health', (c) => {
	return jsonOk(c, {}, 200);
});
