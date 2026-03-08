import { Hono } from 'hono';

import { jsonError, jsonOk, safeParseJson } from '../lib/http';
import { generateWeeklyPlan } from '../services/plan';
import type { Env } from '../types/env';

type GeneratePlanInput = {
  profile_id?: unknown;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asRequiredTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const planRoutes = new Hono<{ Bindings: Env }>();

planRoutes.post('/plan/generate', async (c) => {
  const parsedBody = await safeParseJson(c);
  const body = asObject(parsedBody);

  if (!body) {
    return jsonError(c, 'VALIDATION_ERROR', 'Body JSON invalido.', 400);
  }

  const input: GeneratePlanInput = body;
  const profileId = asRequiredTrimmedString(input.profile_id);

  if (!profileId) {
    return jsonError(c, 'VALIDATION_ERROR', 'profile_id es requerido.', 400);
  }

  try {
    const plan = await generateWeeklyPlan(profileId, c.env);
    return jsonOk(c, plan, 200);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo generar el plan semanal.', 500, {
      hint: messageText,
    });
  }
});

export default planRoutes;
