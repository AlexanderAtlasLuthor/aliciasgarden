import { Hono } from 'hono';
import type { Context } from 'hono';

import { jsonError, jsonOk, safeParseJson } from '../lib/http';
import { getSupabase } from '../lib/supabase';
import type { Env } from '../types/env';

type MeasurementCreateInput = {
  height_cm?: unknown;
  leaf_count?: unknown;
  notes?: unknown;
  measured_at?: unknown;
};

type MeasurementInsertPayload = {
  profile_id: string;
  plant_id: string;
  height_cm?: number;
  leaf_count?: number;
  notes?: string;
  measured_at?: string;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asOptionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asOptionalNonNegativeNumber(value: unknown): number | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  if (value < 0) {
    return null;
  }

  return value;
}

function asOptionalNonNegativeInteger(value: unknown): number | undefined | null {
  const parsed = asOptionalNonNegativeNumber(value);

  if (parsed === undefined || parsed === null) {
    return parsed;
  }

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
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

export const plantMeasurementsRoutes = new Hono<{ Bindings: Env }>();

plantMeasurementsRoutes.post('/plants/:id/measurements', async (c) => {
  const plantId = c.req.param('id');
  const parsedBody = await safeParseJson(c);
  const body = asObject(parsedBody);

  if (!body) {
    return jsonError(c, 'VALIDATION_ERROR', 'Body JSON invalido.', 400);
  }

  const input: MeasurementCreateInput = body;
  const heightCm = asOptionalNonNegativeNumber(input.height_cm);
  const leafCount = asOptionalNonNegativeInteger(input.leaf_count);
  const notes = asOptionalTrimmedString(input.notes);

  if (heightCm === null) {
    return jsonError(c, 'VALIDATION_ERROR', 'height_cm debe ser un numero no negativo.', 400);
  }

  if (leafCount === null) {
    return jsonError(c, 'VALIDATION_ERROR', 'leaf_count debe ser un entero no negativo.', 400);
  }

  let measuredAt: string | undefined;
  if (input.measured_at !== undefined) {
    const rawMeasuredAt = asOptionalTrimmedString(input.measured_at);
    if (!rawMeasuredAt || Number.isNaN(new Date(rawMeasuredAt).getTime())) {
      return jsonError(c, 'VALIDATION_ERROR', 'measured_at invalido.', 400);
    }
    measuredAt = rawMeasuredAt;
  }

  if (heightCm === undefined && leafCount === undefined && notes === undefined) {
    return jsonError(
      c,
      'VALIDATION_ERROR',
      'Se requiere al menos uno de: height_cm, leaf_count o notes.',
      400,
    );
  }

  const payload: MeasurementInsertPayload = {
    profile_id: c.env.PROFILE_ID,
    plant_id: plantId,
  };

  if (heightCm !== undefined) {
    payload.height_cm = heightCm;
  }

  if (leafCount !== undefined) {
    payload.leaf_count = leafCount;
  }

  if (notes !== undefined) {
    payload.notes = notes;
  }

  if (measuredAt) {
    payload.measured_at = measuredAt;
  }

  try {
    const ownershipError = await ensurePlantOwnership(plantId, c);
    if (ownershipError) {
      return ownershipError;
    }

    const supabase = getSupabase(c.env);
    const { data: measurement, error } = await supabase
      .from('measurements')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return jsonError(c, 'DB_ERROR', 'No se pudo guardar la medicion.', 500, {
        hint: error.message,
      });
    }

    return jsonOk(c, { measurement }, 201);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo guardar la medicion.', 500, {
      hint: messageText,
    });
  }
});

plantMeasurementsRoutes.get('/plants/:id/measurements', async (c) => {
  const plantId = c.req.param('id');

  try {
    const ownershipError = await ensurePlantOwnership(plantId, c);
    if (ownershipError) {
      return ownershipError;
    }

    const supabase = getSupabase(c.env);
    const { data: measurements, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('plant_id', plantId)
      .eq('profile_id', c.env.PROFILE_ID)
      .order('measured_at', { ascending: false });

    if (error) {
      return jsonError(c, 'DB_ERROR', 'No se pudieron obtener las mediciones.', 500, {
        hint: error.message,
      });
    }

    return jsonOk(c, { measurements: measurements ?? [] });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudieron obtener las mediciones.', 500, {
      hint: messageText,
    });
  }
});
