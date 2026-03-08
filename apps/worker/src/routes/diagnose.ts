import { Hono } from 'hono';

import { jsonError, jsonOk, safeParseJson } from '../lib/http';
import { getSupabase } from '../lib/supabase';
import { diagnosePlantPhoto } from '../services/diagnose';
import type { Env } from '../types/env';

type DiagnoseInput = {
  plant_id?: unknown;
  photo_url?: unknown;
};

type PlantContextRow = {
  id: string;
  nickname: string;
  species_common: string | null;
};

type DiagnosisInsertPayload = {
  profile_id: string;
  plant_id: string;
  photo_url: string;
  possible_causes: string[];
  action_plan: string[];
  confirmation_questions: string[];
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

export const diagnoseRoutes = new Hono<{ Bindings: Env }>();

diagnoseRoutes.post('/diagnose', async (c) => {
  const parsedBody = await safeParseJson(c);
  const body = asObject(parsedBody);

  if (!body) {
    return jsonError(c, 'VALIDATION_ERROR', 'Body JSON invalido.', 400);
  }

  const input: DiagnoseInput = body;
  const plantId = asRequiredTrimmedString(input.plant_id);
  const photoUrl = asRequiredTrimmedString(input.photo_url);

  if (!plantId || !photoUrl) {
    return jsonError(c, 'VALIDATION_ERROR', 'plant_id y photo_url son requeridos.', 400);
  }

  try {
    const supabase = getSupabase(c.env);

    const { data: plant, error: plantError } = await supabase
      .from('plants')
      .select('id, nickname, species_common')
      .eq('id', plantId)
      .eq('profile_id', c.env.PROFILE_ID)
      .maybeSingle();

    if (plantError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo validar la planta.', 500, {
        hint: plantError.message,
      });
    }

    if (!plant) {
      return jsonError(c, 'NOT_FOUND', 'Planta no encontrada.', 404);
    }

    const diagnosis = await diagnosePlantPhoto(
      {
        photo_url: photoUrl,
        plant_nickname: (plant as PlantContextRow).nickname,
        species_common: (plant as PlantContextRow).species_common,
      },
      c.env,
    );

    const payload: DiagnosisInsertPayload = {
      profile_id: c.env.PROFILE_ID,
      plant_id: plantId,
      photo_url: photoUrl,
      possible_causes: diagnosis.possible_causes,
      action_plan: diagnosis.action_plan,
      confirmation_questions: diagnosis.confirmation_questions,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('diagnoses')
      .insert(payload)
      .select('id')
      .single();

    if (insertError || !inserted?.id) {
      return jsonError(c, 'DB_ERROR', 'No se pudo guardar el diagnostico.', 500, {
        hint: insertError?.message ?? 'Unknown database error',
      });
    }

    return jsonOk(c, {
      diagnosis_id: inserted.id,
      possible_causes: diagnosis.possible_causes,
      action_plan: diagnosis.action_plan,
      confirmation_questions: diagnosis.confirmation_questions,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo generar el diagnostico.', 500, {
      hint: messageText,
    });
  }
});
