import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type JsonData = Record<string, unknown>;

export function jsonOk(
  c: Context,
  data: JsonData,
  status: ContentfulStatusCode = 200,
): Response {
  return c.json({ ok: true, ...data }, status);
}

export function jsonError(
  c: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode = 400,
  details?: unknown,
): Response {
  return c.json(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
    },
    status,
  );
}

export async function safeParseJson(c: Context): Promise<unknown | null> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}
