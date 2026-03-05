import { Hono } from 'hono';
import type { Context } from 'hono';

import { jsonError, jsonOk, safeParseJson } from '../lib/http';
import { getSupabase } from '../lib/supabase';
import type { Env } from '../types/env';

const CARE_EVENT_TYPES = new Set([
  'water',
  'fertilize',
  'prune',
  'repot',
  'pest',
  'treatment',
  'note',
]);

type PlantEventCreateInput = {
  type?: unknown;
  details?: unknown;
  event_at?: unknown;
};

type PlantEventInsertPayload = {
  profile_id: string;
  plant_id: string;
  type: string;
  details?: Record<string, unknown>;
  event_at?: string;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseLimit(rawLimit: string | undefined): number | null {
  if (!rawLimit) {
    return 30;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(parsed, 50);
}

async function ensurePlantOwnership(
  plantId: string,
  c: Context<{ Bindings: Env }>,
): Promise<Response | null> {
  const supabase = getSupabase(c.env);
  const { data: plant, error } = await supabase
    .from('plants')
    .select('id')
    .eq('id', plantId)
    .eq('profile_id', c.env.PROFILE_ID)
    .maybeSingle();

  if (error) {
    return jsonError(c, 'DB_ERROR', 'No se pudo validar la planta.', 500, {
      hint: error.message,
    });
  }

  if (!plant) {
    return jsonError(c, 'NOT_FOUND', 'Planta no encontrada.', 404);
  }

  return null;
}

export const plantEventsRoutes = new Hono<{ Bindings: Env }>();

plantEventsRoutes.get('/plants/:id/events', async (c) => {
  const plantId = c.req.param('id');
  const limit = parseLimit(c.req.query('limit'));

  if (!limit) {
    return jsonError(c, 'VALIDATION_ERROR', 'limit debe ser un numero positivo.', 400);
  }

  try {
    const ownershipError = await ensurePlantOwnership(plantId, c);
    if (ownershipError) {
      return ownershipError;
    }

    const supabase = getSupabase(c.env);
    const { data: events, error } = await supabase
      .from('care_events')
      .select('*')
      .eq('plant_id', plantId)
      .eq('profile_id', c.env.PROFILE_ID)
      .order('event_at', { ascending: false })
      .limit(limit);

    if (error) {
      return jsonError(c, 'DB_ERROR', 'No se pudieron obtener los eventos.', 500, {
        hint: error.message,
      });
    }

    return jsonOk(c, { events: events ?? [] });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudieron obtener los eventos.', 500, {
      hint: messageText,
    });
  }
});

plantEventsRoutes.post('/plants/:id/events', async (c) => {
  const plantId = c.req.param('id');
  const parsedBody = await safeParseJson(c);
  const body = asObject(parsedBody);

  if (!body) {
    return jsonError(c, 'VALIDATION_ERROR', 'Body JSON invalido.', 400);
  }

  const input: PlantEventCreateInput = body;
  const type = asOptionalString(input.type);

  if (!type || !CARE_EVENT_TYPES.has(type)) {
    return jsonError(c, 'VALIDATION_ERROR', 'type invalido.', 400);
  }

  const details = input.details;
  const detailsObject = details === undefined ? undefined : asObject(details);
  if (details !== undefined && !detailsObject) {
    return jsonError(c, 'VALIDATION_ERROR', 'details debe ser un objeto JSON.', 400);
  }

  let eventAt: string | undefined;
  if (input.event_at !== undefined) {
    const rawEventAt = asOptionalString(input.event_at);
    if (!rawEventAt || Number.isNaN(new Date(rawEventAt).getTime())) {
      return jsonError(c, 'VALIDATION_ERROR', 'event_at invalido.', 400);
    }
    eventAt = rawEventAt;
  }

  const payload: PlantEventInsertPayload = {
    profile_id: c.env.PROFILE_ID,
    plant_id: plantId,
    type,
  };

  if (detailsObject) {
    payload.details = detailsObject;
  }

  if (eventAt) {
    payload.event_at = eventAt;
  }

  try {
    const ownershipError = await ensurePlantOwnership(plantId, c);
    if (ownershipError) {
      return ownershipError;
    }

    const supabase = getSupabase(c.env);
    const { data: event, error } = await supabase
      .from('care_events')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return jsonError(c, 'DB_ERROR', 'No se pudo guardar el evento.', 500, {
        hint: error.message,
      });
    }

    return jsonOk(c, { event }, 201);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo guardar el evento.', 500, {
      hint: messageText,
    });
  }
});

plantEventsRoutes.delete('/events/:eventId', async (c) => {
  const eventId = c.req.param('eventId');

  try {
    const supabase = getSupabase(c.env);
    const { data: existingEvent, error: fetchError } = await supabase
      .from('care_events')
      .select('id')
      .eq('id', eventId)
      .eq('profile_id', c.env.PROFILE_ID)
      .maybeSingle();

    if (fetchError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo validar el evento.', 500, {
        hint: fetchError.message,
      });
    }

    if (!existingEvent) {
      return jsonError(c, 'NOT_FOUND', 'Evento no encontrado.', 404);
    }

    const { error: deleteError } = await supabase
      .from('care_events')
      .delete()
      .eq('id', eventId)
      .eq('profile_id', c.env.PROFILE_ID);

    if (deleteError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo eliminar el evento.', 500, {
        hint: deleteError.message,
      });
    }

    return jsonOk(c, {});
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo eliminar el evento.', 500, {
      hint: messageText,
    });
  }
});
