import type { MiddlewareHandler } from 'hono';

export const rateLimitMiddleware: MiddlewareHandler = async (_c, next) => {
  // Stub for Subfase A. Rate limit will be implemented in Subfase B.
  await next();
};
