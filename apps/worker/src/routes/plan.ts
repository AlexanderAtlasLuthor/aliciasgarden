import { Hono } from 'hono';

import { jsonError, jsonOk, safeParseJson } from '../lib/http';
import { getSupabase } from '../lib/supabase';
import { generateWeeklyPlan, type WeeklyPlanResult, type WeeklyPlanTask } from '../services/plan';
import type { Env } from '../types/env';

type GeneratePlanInput = {
  profile_id?: unknown;
};

type WeeklyPlanRow = {
  week_start: string;
  tasks_json: unknown;
};

type DbErrorLike = {
  code?: string;
  message?: string;
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

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getCurrentWeekStart(): string {
  const today = startOfUtcDay(new Date());
  const day = today.getUTCDay();
  const offsetToMonday = day === 0 ? 6 : day - 1;
  return toDateOnly(addUtcDays(today, -offsetToMonday));
}

function toTasks(value: unknown): WeeklyPlanTask[] {
  return Array.isArray(value) ? (value as WeeklyPlanTask[]) : [];
}

function isUniqueViolation(error: DbErrorLike | null | undefined): boolean {
  if (!error) {
    return false;
  }

  const message = (error.message ?? '').toLowerCase();
  return error.code === '23505' || message.includes('duplicate key');
}

async function getStoredWeeklyPlan(
  profileId: string,
  weekStart: string,
  env: Env,
): Promise<{ row: WeeklyPlanRow | null; error: DbErrorLike | null }> {
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from('weekly_plans')
    .select('week_start, tasks_json')
    .eq('profile_id', profileId)
    .eq('week_start', weekStart)
    .maybeSingle();

  return {
    row: (data as WeeklyPlanRow | null) ?? null,
    error,
  };
}

async function persistWeeklyPlan(
  profileId: string,
  plan: WeeklyPlanResult,
  env: Env,
): Promise<{ row: WeeklyPlanRow | null; error: DbErrorLike | null }> {
  const supabase = getSupabase(env);
  const updatedAt = new Date().toISOString();

  const { row: existing, error: existingError } = await getStoredWeeklyPlan(
    profileId,
    plan.week_start,
    env,
  );

  if (existingError) {
    return { row: null, error: existingError };
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('weekly_plans')
      .update({
        tasks_json: plan.tasks,
        updated_at: updatedAt,
      })
      .eq('profile_id', profileId)
      .eq('week_start', plan.week_start)
      .select('week_start, tasks_json')
      .maybeSingle();

    return {
      row: (updated as WeeklyPlanRow | null) ?? null,
      error: updateError,
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('weekly_plans')
    .insert({
      profile_id: profileId,
      week_start: plan.week_start,
      tasks_json: plan.tasks,
      updated_at: updatedAt,
    })
    .select('week_start, tasks_json')
    .single();

  if (!insertError) {
    return {
      row: (inserted as WeeklyPlanRow | null) ?? null,
      error: null,
    };
  }

  if (!isUniqueViolation(insertError)) {
    return { row: null, error: insertError };
  }

  const { data: updatedAfterConflict, error: updateAfterConflictError } = await supabase
    .from('weekly_plans')
    .update({
      tasks_json: plan.tasks,
      updated_at: updatedAt,
    })
    .eq('profile_id', profileId)
    .eq('week_start', plan.week_start)
    .select('week_start, tasks_json')
    .maybeSingle();

  return {
    row: (updatedAfterConflict as WeeklyPlanRow | null) ?? null,
    error: updateAfterConflictError,
  };
}

const planRoutes = new Hono<{ Bindings: Env }>();

planRoutes.get('/plan', async (c) => {
  const profileId = asRequiredTrimmedString(c.env.PROFILE_ID);

  if (!profileId) {
    return jsonError(c, 'VALIDATION_ERROR', 'PROFILE_ID es requerido.', 500);
  }

  const weekStart = getCurrentWeekStart();

  try {
    const { row: existing, error: existingError } = await getStoredWeeklyPlan(
      profileId,
      weekStart,
      c.env,
    );

    if (existingError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo leer el plan semanal.', 500, {
        hint: existingError.message ?? 'Unknown database error',
      });
    }

    if (existing) {
      return jsonOk(c, {
        week_start: existing.week_start,
        tasks: toTasks(existing.tasks_json),
      });
    }

    const generated = await generateWeeklyPlan(profileId, c.env);
    const { row: persisted, error: persistError } = await persistWeeklyPlan(profileId, generated, c.env);

    if (persistError || !persisted) {
      return jsonError(c, 'DB_ERROR', 'No se pudo guardar el plan semanal.', 500, {
        hint: persistError?.message ?? 'Unknown database error',
      });
    }

    return jsonOk(c, {
      week_start: persisted.week_start,
      tasks: toTasks(persisted.tasks_json),
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo obtener el plan semanal.', 500, {
      hint: messageText,
    });
  }
});

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
    const { row: persisted, error: persistError } = await persistWeeklyPlan(profileId, plan, c.env);

    if (persistError || !persisted) {
      return jsonError(c, 'DB_ERROR', 'No se pudo guardar el plan semanal.', 500, {
        hint: persistError?.message ?? 'Unknown database error',
      });
    }

    return jsonOk(
      c,
      {
        week_start: persisted.week_start,
        tasks: toTasks(persisted.tasks_json),
      },
      200,
    );
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo generar el plan semanal.', 500, {
      hint: messageText,
    });
  }
});

export default planRoutes;
