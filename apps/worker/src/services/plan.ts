import { getSupabase } from '../lib/supabase';
import type { Env } from '../types/env';

type PlantRow = {
  id: string;
  nickname: string;
  location: string | null;
  light: string | null;
  watering_interval_days: number | null;
};

type CareEventRow = {
  plant_id: string;
  type: 'water' | 'pest' | 'treatment';
  event_at: string;
};

type MeasurementRow = {
  plant_id: string;
  measured_at: string;
};

type DiagnosisRow = {
  plant_id: string;
  created_at: string;
};

type PlantPhotoRow = {
  plant_id: string;
  taken_at: string | null;
  created_at: string;
};

export type WeeklyPlanTaskPriority = 'low' | 'medium' | 'high';

export type WeeklyPlanTask = {
  task_id: string;
  plant_id: string | null;
  plant_name: string;
  kind: string;
  title: string;
  reason: string;
  due_date: string;
  priority: WeeklyPlanTaskPriority;
  status: 'pending';
};

export type WeeklyPlanResult = {
  week_start: string;
  tasks: WeeklyPlanTask[];
};

const DAYS = {
  pestReview: 14,
  measurement: 7,
  diagnosisFollowUp: 10,
  photo: 14,
} as const;

const PRIORITY_RANK: Record<WeeklyPlanTaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

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

function getCanonicalWeekStart(now: Date): Date {
  const today = startOfUtcDay(now);
  const day = today.getUTCDay();
  const offsetToMonday = day === 0 ? 6 : day - 1;
  return addUtcDays(today, -offsetToMonday);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function daysBetween(a: Date, b: Date): number {
  const diff = startOfUtcDay(a).getTime() - startOfUtcDay(b).getTime();
  return Math.floor(diff / 86400000);
}

function latestDate(values: Array<Date | null>): Date | null {
  let latest: Date | null = null;

  for (const value of values) {
    if (!value) {
      continue;
    }

    if (!latest || value.getTime() > latest.getTime()) {
      latest = value;
    }
  }

  return latest;
}

function hasInteriorLightContext(plant: PlantRow): boolean {
  const context = `${plant.location ?? ''} ${plant.light ?? ''}`.trim();
  if (!context) {
    return false;
  }

  return /(interior|inside|indoor|casa|departamento|habitacion|sala|oficina|ventana|balcon|luz|light|sol|sombra|directa|indirecta)/i.test(
    context,
  );
}

function buildTaskId(weekStart: string, plantId: string, kind: string): string {
  return `${weekStart}:${plantId}:${kind}`;
}

function fallbackPlantName(nickname: string): string {
  const normalized = nickname.trim();
  return normalized.length > 0 ? normalized : 'Planta sin nombre';
}

function pickDueDateInWeek(weekStart: Date, preferredOffsetDays: number, today: Date): string {
  const weekEnd = addUtcDays(weekStart, 6);
  const preferred = addUtcDays(weekStart, preferredOffsetDays);

  if (preferred.getTime() < today.getTime()) {
    return toDateOnly(today <= weekEnd ? today : weekEnd);
  }

  return toDateOnly(preferred <= weekEnd ? preferred : weekEnd);
}

export async function generateWeeklyPlan(
  profileId: string,
  env: Env,
): Promise<WeeklyPlanResult> {
  const normalizedProfileId = profileId.trim();
  if (!normalizedProfileId) {
    throw new Error('profileId is required to generate weekly plan.');
  }

  const now = new Date();
  const today = startOfUtcDay(now);
  const weekStartDate = getCanonicalWeekStart(now);
  const weekStart = toDateOnly(weekStartDate);

  const supabase = getSupabase(env);

  const { data: plantsData, error: plantsError } = await supabase
    .from('plants')
    .select('id, nickname, location, light, watering_interval_days')
    .eq('profile_id', normalizedProfileId)
    .order('created_at', { ascending: true });

  if (plantsError) {
    throw new Error(`Failed to load plants for weekly plan: ${plantsError.message}`);
  }

  const plants = (plantsData ?? []) as PlantRow[];
  if (plants.length === 0) {
    return {
      week_start: weekStart,
      tasks: [],
    };
  }

  const plantIds = plants.map((plant) => plant.id);

  const [careEventsResult, measurementsResult, diagnosesResult, photosResult] = await Promise.all([
    supabase
      .from('care_events')
      .select('plant_id, type, event_at')
      .eq('profile_id', normalizedProfileId)
      .in('plant_id', plantIds)
      .in('type', ['water', 'pest', 'treatment'])
      .order('event_at', { ascending: false }),
    supabase
      .from('measurements')
      .select('plant_id, measured_at')
      .eq('profile_id', normalizedProfileId)
      .in('plant_id', plantIds)
      .order('measured_at', { ascending: false }),
    supabase
      .from('diagnoses')
      .select('plant_id, created_at')
      .eq('profile_id', normalizedProfileId)
      .in('plant_id', plantIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('plant_photos')
      .select('plant_id, taken_at, created_at')
      .eq('profile_id', normalizedProfileId)
      .in('plant_id', plantIds)
      .order('created_at', { ascending: false }),
  ]);

  if (careEventsResult.error) {
    throw new Error(`Failed to load care events for weekly plan: ${careEventsResult.error.message}`);
  }

  if (measurementsResult.error) {
    throw new Error(
      `Failed to load measurements for weekly plan: ${measurementsResult.error.message}`,
    );
  }

  if (diagnosesResult.error) {
    throw new Error(`Failed to load diagnoses for weekly plan: ${diagnosesResult.error.message}`);
  }

  if (photosResult.error) {
    throw new Error(`Failed to load plant photos for weekly plan: ${photosResult.error.message}`);
  }

  const careEvents = (careEventsResult.data ?? []) as CareEventRow[];
  const measurements = (measurementsResult.data ?? []) as MeasurementRow[];
  const diagnoses = (diagnosesResult.data ?? []) as DiagnosisRow[];
  const photos = (photosResult.data ?? []) as PlantPhotoRow[];

  const lastWaterByPlant = new Map<string, Date>();
  const lastPestOrTreatmentByPlant = new Map<string, Date>();
  const lastMeasurementByPlant = new Map<string, Date>();
  const lastDiagnosisByPlant = new Map<string, Date>();
  const lastPhotoByPlant = new Map<string, Date>();

  for (const event of careEvents) {
    const eventAt = parseDate(event.event_at);
    if (!eventAt) {
      continue;
    }

    if (event.type === 'water' && !lastWaterByPlant.has(event.plant_id)) {
      lastWaterByPlant.set(event.plant_id, eventAt);
      continue;
    }

    if ((event.type === 'pest' || event.type === 'treatment') && !lastPestOrTreatmentByPlant.has(event.plant_id)) {
      lastPestOrTreatmentByPlant.set(event.plant_id, eventAt);
    }
  }

  for (const measurement of measurements) {
    if (lastMeasurementByPlant.has(measurement.plant_id)) {
      continue;
    }

    const measuredAt = parseDate(measurement.measured_at);
    if (measuredAt) {
      lastMeasurementByPlant.set(measurement.plant_id, measuredAt);
    }
  }

  for (const diagnosis of diagnoses) {
    if (lastDiagnosisByPlant.has(diagnosis.plant_id)) {
      continue;
    }

    const createdAt = parseDate(diagnosis.created_at);
    if (createdAt) {
      lastDiagnosisByPlant.set(diagnosis.plant_id, createdAt);
    }
  }

  for (const photo of photos) {
    if (lastPhotoByPlant.has(photo.plant_id)) {
      continue;
    }

    const bestPhotoDate = latestDate([parseDate(photo.taken_at), parseDate(photo.created_at)]);
    if (bestPhotoDate) {
      lastPhotoByPlant.set(photo.plant_id, bestPhotoDate);
    }
  }

  const tasks: WeeklyPlanTask[] = [];
  const taskIds = new Set<string>();

  const pushTask = (task: WeeklyPlanTask) => {
    if (taskIds.has(task.task_id)) {
      return;
    }

    taskIds.add(task.task_id);
    tasks.push(task);
  };

  for (const plant of plants) {
    const plantName = fallbackPlantName(plant.nickname);
    const plantId = plant.id;

    const lastWaterAt = lastWaterByPlant.get(plantId) ?? null;
    const wateringInterval = plant.watering_interval_days ?? null;

    if (wateringInterval && wateringInterval > 0) {
      const nextWaterDate = lastWaterAt ? addUtcDays(lastWaterAt, wateringInterval) : null;
      const shouldWater = !nextWaterDate || nextWaterDate.getTime() <= today.getTime();

      if (shouldWater) {
        const overdueDays = nextWaterDate ? Math.max(0, daysBetween(today, nextWaterDate)) : wateringInterval;
        const priority: WeeklyPlanTaskPriority = overdueDays >= 2 ? 'high' : 'medium';
        const reason = lastWaterAt
          ? `Han pasado ${daysBetween(today, lastWaterAt)} dias desde el ultimo riego y el intervalo es cada ${wateringInterval} dias.`
          : `No hay registros de riego. Intervalo recomendado: cada ${wateringInterval} dias.`;

        pushTask({
          task_id: buildTaskId(weekStart, plantId, 'watering'),
          plant_id: plantId,
          plant_name: plantName,
          kind: 'watering',
          title: `Regar ${plantName}`,
          reason,
          due_date: toDateOnly(today),
          priority,
          status: 'pending',
        });
      }
    }

    const lastPestAt = lastPestOrTreatmentByPlant.get(plantId) ?? null;
    const needsPestReview = !lastPestAt || daysBetween(today, lastPestAt) >= DAYS.pestReview;

    if (needsPestReview) {
      const daysWithoutReview = lastPestAt ? daysBetween(today, lastPestAt) : DAYS.pestReview;
      pushTask({
        task_id: buildTaskId(weekStart, plantId, 'pest-check'),
        plant_id: plantId,
        plant_name: plantName,
        kind: 'pest_check',
        title: `Revisar plagas en ${plantName}`,
        reason: lastPestAt
          ? `No hay revision sanitaria reciente (${daysWithoutReview} dias).`
          : 'No existe historial de revision de plagas o tratamiento.',
        due_date: pickDueDateInWeek(weekStartDate, 1, today),
        priority: daysWithoutReview >= 21 ? 'high' : 'medium',
        status: 'pending',
      });
    }

    const lastMeasurementAt = lastMeasurementByPlant.get(plantId) ?? null;
    const needsMeasurement = !lastMeasurementAt || daysBetween(today, lastMeasurementAt) >= DAYS.measurement;

    if (needsMeasurement) {
      const daysWithoutMeasurement = lastMeasurementAt
        ? daysBetween(today, lastMeasurementAt)
        : DAYS.measurement;

      pushTask({
        task_id: buildTaskId(weekStart, plantId, 'growth-measurement'),
        plant_id: plantId,
        plant_name: plantName,
        kind: 'growth_measurement',
        title: `Registrar crecimiento de ${plantName}`,
        reason: lastMeasurementAt
          ? `La ultima medicion fue hace ${daysWithoutMeasurement} dias.`
          : 'No hay mediciones registradas para esta planta.',
        due_date: pickDueDateInWeek(weekStartDate, 2, today),
        priority: daysWithoutMeasurement >= 14 ? 'high' : 'medium',
        status: 'pending',
      });
    }

    const lastDiagnosisAt = lastDiagnosisByPlant.get(plantId) ?? null;
    const hasRecentDiagnosis =
      !!lastDiagnosisAt && daysBetween(today, lastDiagnosisAt) <= DAYS.diagnosisFollowUp;

    if (hasRecentDiagnosis && lastDiagnosisAt) {
      const daysSinceDiagnosis = daysBetween(today, lastDiagnosisAt);
      pushTask({
        task_id: buildTaskId(weekStart, plantId, 'diagnosis-follow-up'),
        plant_id: plantId,
        plant_name: plantName,
        kind: 'diagnosis_follow_up',
        title: `Seguimiento de diagnostico para ${plantName}`,
        reason: `Hay un diagnostico reciente de hace ${daysSinceDiagnosis} dias que requiere revision de evolucion.`,
        due_date: pickDueDateInWeek(weekStartDate, 1, today),
        priority: daysSinceDiagnosis >= 5 ? 'high' : 'medium',
        status: 'pending',
      });
    }

    const lastPhotoAt = lastPhotoByPlant.get(plantId) ?? null;
    const needsProgressPhoto = !lastPhotoAt || daysBetween(today, lastPhotoAt) >= DAYS.photo;

    if (needsProgressPhoto) {
      const daysWithoutPhoto = lastPhotoAt ? daysBetween(today, lastPhotoAt) : DAYS.photo;
      pushTask({
        task_id: buildTaskId(weekStart, plantId, 'progress-photo'),
        plant_id: plantId,
        plant_name: plantName,
        kind: 'progress_photo',
        title: `Tomar foto de progreso de ${plantName}`,
        reason: lastPhotoAt
          ? `No hay fotos recientes (${daysWithoutPhoto} dias).`
          : 'No hay fotos registradas para comparar progreso.',
        due_date: pickDueDateInWeek(weekStartDate, 4, today),
        priority: daysWithoutPhoto >= 21 ? 'medium' : 'low',
        status: 'pending',
      });
    }

    if (hasInteriorLightContext(plant)) {
      pushTask({
        task_id: buildTaskId(weekStart, plantId, 'light-rotation'),
        plant_id: plantId,
        plant_name: plantName,
        kind: 'light_rotation',
        title: `Revisar luz y rotacion de ${plantName}`,
        reason: 'La planta tiene contexto de interior/luz y conviene validar exposicion uniforme.',
        due_date: pickDueDateInWeek(weekStartDate, 5, today),
        priority: 'low',
        status: 'pending',
      });
    }
  }

  tasks.sort((a, b) => {
    if (a.due_date !== b.due_date) {
      return a.due_date.localeCompare(b.due_date);
    }

    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    if (a.plant_name !== b.plant_name) {
      return a.plant_name.localeCompare(b.plant_name);
    }

    return a.kind.localeCompare(b.kind);
  });

  return {
    week_start: weekStart,
    tasks,
  };
}
