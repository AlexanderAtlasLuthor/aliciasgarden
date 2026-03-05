import type { MiddlewareHandler } from 'hono';

import { jsonError } from '../lib/http';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const LIMIT = 60;
const rateLimitStore = new Map<string, RateLimitEntry>();

function getIpKey(c: Parameters<MiddlewareHandler>[0]): string {
  const cfIp = c.req.header('CF-Connecting-IP');
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = c.req.header('X-Forwarded-For');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return 'unknown';
}

export function rateLimit(): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    const ip = getIpKey(c);
    const existing = rateLimitStore.get(ip);

    if (!existing || now >= existing.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      await next();
      return;
    }

    existing.count += 1;

    if (existing.count > LIMIT) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      return jsonError(
        c,
        'RATE_LIMITED',
        'Demasiadas solicitudes. Intenta de nuevo en un minuto.',
        429,
        { retry_after_seconds: retryAfterSeconds },
      );
    }

    await next();
  };
}
