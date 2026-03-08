import { Hono } from 'hono';

import { jsonError, jsonOk, safeParseJson } from '../lib/http';
import { getSupabase } from '../lib/supabase';
import { generateWeeklyPlan, type WeeklyPlanResult, type WeeklyPlanTask } from '../services/plan';
import type { Env } from '../types/env';

type GeneratePlanInput = {
  profile_id?: unknown;
};

type ManualTaskInput = {
  plant_id?: unknown;
  title?: unknown;
  reason?: unknown;
  priority?: unknown;
  due_date?: unknown;
};

type WeeklyPlanRow = {
  week_start: string;
  tasks_json: unknown;
};

type DbErrorLike = {
  code?: string;
  message?: string;
};

type PlantOwnershipRow = {
  id: string;
  nickname: string;
};

type CareEventType = 'water' | 'pest' | 'note';

const CARE_EVENT_TYPE_BY_TASK_KIND: Record<string, CareEventType | undefined> = {
  watering: 'water',
  pest_check: 'pest',
  diagnosis_follow_up: 'note',
  light_rotation: 'note',
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

function isValidTaskPriority(value: unknown): value is WeeklyPlanTask['priority'] {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
  );
}

function buildManualTaskId(plantId: string): string {
  return `manual-${Date.now()}-${plantId}`;
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

async function getOwnedPlant(
  profileId: string,
  plantId: string,
  env: Env,
): Promise<{ plant: PlantOwnershipRow | null; error: DbErrorLike | null }> {
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from('plants')
    .select('id, nickname')
    .eq('id', plantId)
    .eq('profile_id', profileId)
    .maybeSingle();

  return {
    plant: (data as PlantOwnershipRow | null) ?? null,
    error,
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

planRoutes.post('/plan/tasks/:taskId/complete', async (c) => {
  const profileId = asRequiredTrimmedString(c.env.PROFILE_ID);

  if (!profileId) {
    return jsonError(c, 'VALIDATION_ERROR', 'PROFILE_ID es requerido.', 500);
  }

  const taskId = asRequiredTrimmedString(c.req.param('taskId'));
  if (!taskId) {
    return jsonError(c, 'VALIDATION_ERROR', 'taskId es requerido.', 400);
  }

  const weekStart = getCurrentWeekStart();

  try {
    const { row: storedPlan, error: storedPlanError } = await getStoredWeeklyPlan(
      profileId,
      weekStart,
      c.env,
    );

    if (storedPlanError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo leer el plan semanal.', 500, {
        hint: storedPlanError.message ?? 'Unknown database error',
      });
    }

    if (!storedPlan) {
      return jsonError(c, 'PLAN_NOT_FOUND', 'No existe plan semanal para la semana actual.', 404);
    }

    const tasks = toTasks(storedPlan.tasks_json);
    const existingTask = tasks.find((task) => task.task_id === taskId);

    if (!existingTask) {
      return jsonError(c, 'TASK_NOT_FOUND', 'No existe la tarea solicitada en el plan actual.', 404);
    }

    if (existingTask.status === 'completed') {
      return jsonOk(c, {
        week_start: storedPlan.week_start,
        tasks,
      });
    }

    const completedAt = new Date().toISOString();
    const updatedTask: WeeklyPlanTask = {
      ...existingTask,
      status: 'completed',
      completed_at: completedAt,
    };

    const mappedEventType = CARE_EVENT_TYPE_BY_TASK_KIND[existingTask.kind];
    const shouldCreateCareEvent = !!existingTask.plant_id && !!mappedEventType;

    const supabase = getSupabase(c.env);

    if (shouldCreateCareEvent) {
      const payload = {
        profile_id: profileId,
        plant_id: existingTask.plant_id,
        type: mappedEventType,
        event_at: completedAt,
        details: {
          source: 'weekly_plan',
          task_id: existingTask.task_id,
          task_kind: existingTask.kind,
          title: existingTask.title,
          reason: existingTask.reason,
        },
      };

      const { error: eventInsertError } = await supabase
        .from('care_events')
        .insert(payload)
        .select('*')
        .single();

      if (eventInsertError) {
        console.error('Failed to create care_event from weekly plan task completion.', {
          profile_id: profileId,
          task_id: existingTask.task_id,
          task_kind: existingTask.kind,
          plant_id: existingTask.plant_id,
          error: eventInsertError.message,
        });
      }
    }

    const updatedTasks = tasks.map((task) => (task.task_id === taskId ? updatedTask : task));
    const { error: updateError } = await supabase
      .from('weekly_plans')
      .update({
        tasks_json: updatedTasks,
        updated_at: completedAt,
      })
      .eq('profile_id', profileId)
      .eq('week_start', weekStart);

    if (updateError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo actualizar el plan semanal.', 500, {
        hint: updateError.message,
      });
    }

    return jsonOk(c, {
      week_start: weekStart,
      tasks: updatedTasks,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo completar la tarea del plan semanal.', 500, {
      hint: messageText,
    });
  }
});

planRoutes.post('/plan/tasks/manual', async (c) => {
  const profileId = asRequiredTrimmedString(c.env.PROFILE_ID);

  if (!profileId) {
    return jsonError(c, 'VALIDATION_ERROR', 'PROFILE_ID es requerido.', 500);
  }

  const parsedBody = await safeParseJson(c);
  const body = asObject(parsedBody);

  if (!body) {
    return jsonError(c, 'VALIDATION_ERROR', 'Body JSON invalido.', 400);
  }

  const input: ManualTaskInput = body;
  const plantId = asRequiredTrimmedString(input.plant_id);
  const title = asRequiredTrimmedString(input.title);
  const reason = asRequiredTrimmedString(input.reason);
  const dueDate = asRequiredTrimmedString(input.due_date);

  if (!plantId) {
    return jsonError(c, 'VALIDATION_ERROR', 'plant_id es requerido.', 400);
  }

  if (!title) {
    return jsonError(c, 'VALIDATION_ERROR', 'title es requerido.', 400);
  }

  if (!reason) {
    return jsonError(c, 'VALIDATION_ERROR', 'reason es requerido.', 400);
  }

  if (!isValidTaskPriority(input.priority)) {
    return jsonError(c, 'VALIDATION_ERROR', 'priority invalida.', 400);
  }

  if (!dueDate || !isValidDateOnly(dueDate)) {
    return jsonError(c, 'VALIDATION_ERROR', 'due_date invalida.', 400);
  }

  const weekStart = getCurrentWeekStart();

  try {
    const { plant, error: plantError } = await getOwnedPlant(profileId, plantId, c.env);

    if (plantError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo validar la planta.', 500, {
        hint: plantError.message ?? 'Unknown database error',
      });
    }

    if (!plant) {
      return jsonError(c, 'PLANT_NOT_FOUND', 'No existe la planta solicitada para este perfil.', 404);
    }

    let { row: storedPlan, error: storedPlanError } = await getStoredWeeklyPlan(profileId, weekStart, c.env);

    if (storedPlanError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo leer el plan semanal.', 500, {
        hint: storedPlanError.message ?? 'Unknown database error',
      });
    }

    if (!storedPlan) {
      const generated = await generateWeeklyPlan(profileId, c.env);
      const { row: persisted, error: persistError } = await persistWeeklyPlan(profileId, generated, c.env);

      if (persistError || !persisted) {
        return jsonError(c, 'DB_ERROR', 'No se pudo guardar el plan semanal.', 500, {
          hint: persistError?.message ?? 'Unknown database error',
        });
      }

      storedPlan = persisted;
      storedPlanError = null;
    }

    const tasks = toTasks(storedPlan.tasks_json);
    const manualTask: WeeklyPlanTask = {
      task_id: buildManualTaskId(plant.id),
      plant_id: plant.id,
      plant_name: plant.nickname?.trim() || 'Planta sin nombre',
      kind: 'manual',
      title,
      reason,
      due_date: dueDate,
      priority: input.priority,
      status: 'pending',
      completed_at: null,
    };

    const updatedTasks = [...tasks, manualTask];
    const updatedAt = new Date().toISOString();

    const supabase = getSupabase(c.env);
    const { error: updateError } = await supabase
      .from('weekly_plans')
      .update({
        tasks_json: updatedTasks,
        updated_at: updatedAt,
      })
      .eq('profile_id', profileId)
      .eq('week_start', storedPlan.week_start);

    if (updateError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo actualizar el plan semanal.', 500, {
        hint: updateError.message,
      });
    }

    return jsonOk(c, {
      week_start: storedPlan.week_start,
      tasks: updatedTasks,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo crear la tarea manual del plan semanal.', 500, {
      hint: messageText,
    });
  }
});

export default planRoutes;
