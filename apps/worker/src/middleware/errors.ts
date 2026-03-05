import type { Context, Next } from 'hono';

export async function errorMiddleware(c: Context, next: Next): Promise<Response | void> {
  try {
    await next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ status: 500, message }, 500);
  }
}
