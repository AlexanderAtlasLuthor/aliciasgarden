import type { MiddlewareHandler } from 'hono';

export const corsMiddleware: MiddlewareHandler = async (_c, next) => {
  // Stub for Subfase A. CORS behavior will be implemented in Subfase B.
  await next();
};
