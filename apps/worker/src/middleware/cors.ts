import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

function parseAllowedOrigins(rawValue: string): string[] {
  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function resolveCorsOrigin(requestOrigin: string | undefined, configuredOrigins: string): string {
  const allowedOrigins = parseAllowedOrigins(configuredOrigins);
  if (allowedOrigins.length === 0) {
    return configuredOrigins;
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0];
}

function setCorsHeaders(c: Parameters<MiddlewareHandler<{ Bindings: Env }>>[0], origin: string): void {
  c.header('Access-Control-Allow-Origin', origin);
  c.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');
}

export function cors(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const requestOrigin = c.req.header('Origin');
    const origin = resolveCorsOrigin(requestOrigin, c.env.CORS_ORIGIN);
    setCorsHeaders(c, origin);

    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204);
    }

    await next();
    setCorsHeaders(c, origin);
  };
}
