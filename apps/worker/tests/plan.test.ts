import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type TestEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PROFILE_ID?: string;
  CORS_ORIGIN: string;
};

type WeeklyPlanTask = {
  task_id: string;
  plant_id: string | null;
  plant_name: string;
  kind: string;
  title: string;
  reason: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  completed_at?: string | null;
};

type WeeklyPlanResult = {
  week_start: string;
  tasks: WeeklyPlanTask[];
};

type WeeklyPlanRow = {
  week_start: string;
  tasks_json: WeeklyPlanTask[];
};

type SupabaseError = { code?: string; message: string } | null;

type SelectResult = {
  data: WeeklyPlanRow | null;
  error: SupabaseError;
};

type SupabaseState = {
  selectResults: SelectResult[];
  insertData: WeeklyPlanRow | null;
  insertError: SupabaseError;
  updateData: WeeklyPlanRow | null;
  updateError: SupabaseError;
  insertPayloads: Record<string, unknown>[];
  updatePayloads: Record<string, unknown>[];
  selectFilters: Array<Record<string, unknown>>;
  updateFilters: Array<Record<string, unknown>>;
  accessedTables: string[];
};

const testEnv: TestEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  PROFILE_ID: 'test-profile',
  CORS_ORIGIN: 'http://localhost:3000',
};

const generatedPlan: WeeklyPlanResult = {
  week_start: '2026-03-02',
  tasks: [
    {
      task_id: '2026-03-02:plant-1:water',
      plant_id: 'plant-1',
      plant_name: 'Monstera',
      kind: 'water',
      title: 'Regar Monstera',
      reason: 'Han pasado 7 dias desde el ultimo riego.',
      due_date: '2026-03-03',
      priority: 'medium',
      status: 'pending',
    },
  ],
};

const supabaseState: SupabaseState = {
  selectResults: [],
  insertData: null,
  insertError: null,
  updateData: null,
  updateError: null,
  insertPayloads: [],
  updatePayloads: [],
  selectFilters: [],
  updateFilters: [],
  accessedTables: [],
};

const generateWeeklyPlanMock = vi.fn(async () => generatedPlan);

const getSupabaseMock = vi.fn(() => ({
  from: (table: string) => {
    supabaseState.accessedTables.push(table);

    if (table !== 'weekly_plans') {
      throw new Error(`Unexpected table access: ${table}`);
    }

    return {
      select: () => {
        const filters: Record<string, unknown> = {};
        return {
          eq: (column: string, value: unknown) => {
            filters[column] = value;
            return {
              eq: (secondColumn: string, secondValue: unknown) => {
                filters[secondColumn] = secondValue;
                return {
                  maybeSingle: async () => {
                    supabaseState.selectFilters.push({ ...filters });
                    const next = supabaseState.selectResults.shift() ?? {
                      data: null,
                      error: null,
                    };
                    return next;
                  },
                };
              },
            };
          },
        };
      },
      insert: (payload: Record<string, unknown>) => {
        supabaseState.insertPayloads.push(payload);
        return {
          select: () => ({
            single: async () => ({
              data: supabaseState.insertData,
              error: supabaseState.insertError,
            }),
          }),
        };
      },
      update: (payload: Record<string, unknown>) => {
        supabaseState.updatePayloads.push(payload);
        const filters: Record<string, unknown> = {};
        return {
          eq: (column: string, value: unknown) => {
            filters[column] = value;
            return {
              eq: (secondColumn: string, secondValue: unknown) => {
                filters[secondColumn] = secondValue;
                return {
                  data: supabaseState.updateData,
                  error: supabaseState.updateError,
                  select: () => ({
                    maybeSingle: async () => {
                      supabaseState.updateFilters.push({ ...filters });
                      return {
                        data: supabaseState.updateData,
                        error: supabaseState.updateError,
                      };
                    },
                  }),
                };
              },
            };
          },
        };
      },
    };
  },
}));

vi.mock('../src/lib/supabase', () => ({
  getSupabase: (...args: unknown[]) => getSupabaseMock(...args),
}));

vi.mock('../src/services/plan', () => ({
  generateWeeklyPlan: (...args: unknown[]) => generateWeeklyPlanMock(...args),
}));

function getErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const maybeBody = body as {
    code?: unknown;
    error?: { code?: unknown };
  };

  if (typeof maybeBody.code === 'string') {
    return maybeBody.code;
  }

  if (maybeBody.error && typeof maybeBody.error.code === 'string') {
    return maybeBody.error.code;
  }

  return undefined;
}

beforeEach(() => {
  supabaseState.selectResults = [];
  supabaseState.insertData = null;
  supabaseState.insertError = null;
  supabaseState.updateData = null;
  supabaseState.updateError = null;
  supabaseState.insertPayloads = [];
  supabaseState.updatePayloads = [];
  supabaseState.selectFilters = [];
  supabaseState.updateFilters = [];
  supabaseState.accessedTables = [];

  getSupabaseMock.mockClear();
  generateWeeklyPlanMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('plan routes - subfase 5.2', () => {
  it('GET /plan creates and persists weekly plan on miss', async () => {
    supabaseState.selectResults = [
      { data: null, error: null },
      { data: null, error: null },
    ];
    supabaseState.insertData = {
      week_start: generatedPlan.week_start,
      tasks_json: generatedPlan.tasks,
    };

    const { default: app } = await import('../src/index');

    const response = await app.request('/plan', {}, testEnv as Required<TestEnv>);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      week_start: generatedPlan.week_start,
      tasks: generatedPlan.tasks,
    });

    expect(generateWeeklyPlanMock).toHaveBeenCalledTimes(1);
    expect(generateWeeklyPlanMock).toHaveBeenCalledWith('test-profile', expect.any(Object));

    expect(supabaseState.accessedTables).toContain('weekly_plans');
    expect(supabaseState.selectFilters.length).toBeGreaterThanOrEqual(1);
    expect(supabaseState.selectFilters[0]).toMatchObject({
      profile_id: 'test-profile',
      week_start: generatedPlan.week_start,
    });

    expect(supabaseState.insertPayloads).toHaveLength(1);
    expect(supabaseState.insertPayloads[0]).toMatchObject({
      profile_id: 'test-profile',
      week_start: generatedPlan.week_start,
      tasks_json: generatedPlan.tasks,
    });
    expect(typeof supabaseState.insertPayloads[0].updated_at).toBe('string');
  });

  it('GET /plan returns persisted row without regenerating when row exists', async () => {
    supabaseState.selectResults = [
      {
        data: {
          week_start: generatedPlan.week_start,
          tasks_json: generatedPlan.tasks,
        },
        error: null,
      },
    ];

    const { default: app } = await import('../src/index');

    const response = await app.request('/plan', {}, testEnv as Required<TestEnv>);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      week_start: generatedPlan.week_start,
      tasks: generatedPlan.tasks,
    });

    expect(generateWeeklyPlanMock).not.toHaveBeenCalled();
    expect(supabaseState.insertPayloads).toHaveLength(0);
  });

  it('GET /plan returns consistent error when PROFILE_ID is invalid', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request('/plan', {}, {
      ...testEnv,
      PROFILE_ID: '   ',
    });
    const body = (await response.json()) as unknown;

    expect(response.status).toBe(500);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plan/generate returns 400 for invalid JSON body', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      },
      testEnv as Required<TestEnv>,
    );
    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plan/generate returns 400 when profile_id is missing', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
      testEnv as Required<TestEnv>,
    );
    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plan/generate returns 400 when profile_id is empty', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: '   ' }),
      },
      testEnv as Required<TestEnv>,
    );
    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plan/generate inserts when weekly row does not exist', async () => {
    supabaseState.selectResults = [{ data: null, error: null }];
    supabaseState.insertData = {
      week_start: generatedPlan.week_start,
      tasks_json: generatedPlan.tasks,
    };

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: 'test-profile' }),
      },
      testEnv as Required<TestEnv>,
    );

    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      week_start: generatedPlan.week_start,
      tasks: generatedPlan.tasks,
    });

    expect(generateWeeklyPlanMock).toHaveBeenCalledTimes(1);
    expect(supabaseState.insertPayloads).toHaveLength(1);
    expect(supabaseState.insertPayloads[0]).toMatchObject({
      profile_id: 'test-profile',
      week_start: generatedPlan.week_start,
      tasks_json: generatedPlan.tasks,
    });
    const insertedUpdatedAt = supabaseState.insertPayloads[0].updated_at;
    expect(typeof insertedUpdatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(String(insertedUpdatedAt)))).toBe(false);
  });

  it('POST /plan/generate updates tasks_json and updated_at when weekly row exists', async () => {
    supabaseState.selectResults = [
      {
        data: {
          week_start: generatedPlan.week_start,
          tasks_json: [],
        },
        error: null,
      },
    ];
    supabaseState.updateData = {
      week_start: generatedPlan.week_start,
      tasks_json: generatedPlan.tasks,
    };

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: 'test-profile' }),
      },
      testEnv as Required<TestEnv>,
    );

    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      week_start: generatedPlan.week_start,
      tasks: generatedPlan.tasks,
    });

    expect(supabaseState.insertPayloads).toHaveLength(0);
    expect(supabaseState.updatePayloads).toHaveLength(1);
    expect(supabaseState.updatePayloads[0]).toMatchObject({
      tasks_json: generatedPlan.tasks,
    });
    const updatedAt = supabaseState.updatePayloads[0].updated_at;
    expect(typeof updatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(String(updatedAt)))).toBe(false);
    expect(supabaseState.updateFilters[0]).toMatchObject({
      profile_id: 'test-profile',
      week_start: generatedPlan.week_start,
    });
  });

  it('POST /plan/generate handles unique conflict with update fallback', async () => {
    supabaseState.selectResults = [{ data: null, error: null }];
    supabaseState.insertError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    };
    supabaseState.updateData = {
      week_start: generatedPlan.week_start,
      tasks_json: generatedPlan.tasks,
    };

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: 'test-profile' }),
      },
      testEnv as Required<TestEnv>,
    );

    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      week_start: generatedPlan.week_start,
      tasks: generatedPlan.tasks,
    });

    expect(supabaseState.insertPayloads).toHaveLength(1);
    expect(supabaseState.updatePayloads).toHaveLength(1);
  });
});

describe('plan routes - subfase 5.3', () => {
  it('POST /plan/tasks/:taskId/complete returns 404 PLAN_NOT_FOUND when weekly plan does not exist', async () => {
    supabaseState.selectResults = [{ data: null, error: null }];

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/tasks/task-404/complete',
      { method: 'POST' },
      testEnv as Required<TestEnv>,
    );
    const body = (await response.json()) as unknown;

    expect(response.status).toBe(404);
    expect(getErrorCode(body)).toBe('PLAN_NOT_FOUND');
    expect(supabaseState.updatePayloads).toHaveLength(0);
  });

  it('POST /plan/tasks/:taskId/complete returns 404 TASK_NOT_FOUND when task is missing in tasks_json', async () => {
    supabaseState.selectResults = [
      {
        data: {
          week_start: generatedPlan.week_start,
          tasks_json: [
            {
              task_id: 'existing-task',
              plant_id: 'plant-1',
              plant_name: 'Monstera',
              kind: 'watering',
              title: 'Regar Monstera',
              reason: 'Pendiente.',
              due_date: '2026-03-03',
              priority: 'medium',
              status: 'pending',
            },
          ],
        },
        error: null,
      },
    ];

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/tasks/missing-task/complete',
      { method: 'POST' },
      testEnv as Required<TestEnv>,
    );
    const body = (await response.json()) as unknown;

    expect(response.status).toBe(404);
    expect(getErrorCode(body)).toBe('TASK_NOT_FOUND');
    expect(supabaseState.updatePayloads).toHaveLength(0);
  });

  it('POST /plan/tasks/:taskId/complete completes pending task, preserves order, and persists tasks_json', async () => {
    const originalTasks: WeeklyPlanTask[] = [
      {
        task_id: 'task-1',
        plant_id: 'plant-1',
        plant_name: 'Monstera',
        kind: 'watering',
        title: 'Regar Monstera',
        reason: 'Han pasado 7 dias.',
        due_date: '2026-03-03',
        priority: 'high',
        status: 'pending',
      },
      {
        task_id: 'task-2',
        plant_id: 'plant-2',
        plant_name: 'Poto',
        kind: 'growth_measurement',
        title: 'Medir Poto',
        reason: 'No hay medicion reciente.',
        due_date: '2026-03-04',
        priority: 'low',
        status: 'pending',
      },
    ];

    supabaseState.selectResults = [
      {
        data: {
          week_start: generatedPlan.week_start,
          tasks_json: originalTasks,
        },
        error: null,
      },
    ];

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/tasks/task-1/complete',
      { method: 'POST' },
      testEnv as Required<TestEnv>,
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      week_start: generatedPlan.week_start,
    });

    expect(Object.prototype.hasOwnProperty.call(body, 'week_start')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(body, 'tasks')).toBe(true);

    const responseTasks = body.tasks as WeeklyPlanTask[];
    expect(Array.isArray(responseTasks)).toBe(true);
    expect(responseTasks).toHaveLength(2);

    expect(responseTasks[0].task_id).toBe('task-1');
    expect(responseTasks[1].task_id).toBe('task-2');

    expect(responseTasks[0].status).toBe('completed');
    expect(typeof responseTasks[0].completed_at).toBe('string');
    expect(Number.isNaN(Date.parse(String(responseTasks[0].completed_at)))).toBe(false);

    expect(responseTasks[1]).toEqual(originalTasks[1]);

    expect(supabaseState.updatePayloads).toHaveLength(1);
    const updatePayload = supabaseState.updatePayloads[0] as {
      tasks_json?: WeeklyPlanTask[];
      updated_at?: string;
    };

    expect(updatePayload.tasks_json).toBeDefined();
    expect(updatePayload.tasks_json).toHaveLength(2);
    expect(updatePayload.tasks_json?.[0].task_id).toBe('task-1');
    expect(updatePayload.tasks_json?.[1].task_id).toBe('task-2');
    expect(updatePayload.tasks_json?.[0].status).toBe('completed');
    expect(typeof updatePayload.tasks_json?.[0].completed_at).toBe('string');
    expect(updatePayload.tasks_json?.[1]).toEqual(originalTasks[1]);

    expect(typeof updatePayload.updated_at).toBe('string');
    expect(Number.isNaN(Date.parse(String(updatePayload.updated_at)))).toBe(false);
  });

  it('POST /plan/tasks/:taskId/complete is idempotent when task is already completed', async () => {
    const alreadyCompletedAt = '2026-03-03T10:20:30.000Z';
    const tasks: WeeklyPlanTask[] = [
      {
        task_id: 'task-1',
        plant_id: 'plant-1',
        plant_name: 'Monstera',
        kind: 'watering',
        title: 'Regar Monstera',
        reason: 'Ya completada.',
        due_date: '2026-03-03',
        priority: 'medium',
        status: 'completed',
        completed_at: alreadyCompletedAt,
      },
      {
        task_id: 'task-2',
        plant_id: 'plant-2',
        plant_name: 'Poto',
        kind: 'growth_measurement',
        title: 'Medir Poto',
        reason: 'Sigue pendiente.',
        due_date: '2026-03-04',
        priority: 'low',
        status: 'pending',
      },
    ];

    supabaseState.selectResults = [
      {
        data: {
          week_start: generatedPlan.week_start,
          tasks_json: tasks,
        },
        error: null,
      },
    ];

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plan/tasks/task-1/complete',
      { method: 'POST' },
      testEnv as Required<TestEnv>,
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      week_start: generatedPlan.week_start,
      tasks,
    });

    expect(supabaseState.updatePayloads).toHaveLength(0);
  });
});
