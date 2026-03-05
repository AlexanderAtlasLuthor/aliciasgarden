import type { MiddlewareHandler } from 'hono';

import { jsonError } from '../lib/http';

class HttpError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function errors(): MiddlewareHandler {
  return async (c, next) => {
    try {
      await next();
    } catch (error) {
      console.error('Unhandled worker error', error);

      if (error instanceof HttpError) {
        return jsonError(c, error.code, error.message, error.status, error.details);
      }

      return jsonError(
        c,
        'INTERNAL_ERROR',
        'Error interno. Intenta de nuevo.',
        500,
      );
    }
  };
}
