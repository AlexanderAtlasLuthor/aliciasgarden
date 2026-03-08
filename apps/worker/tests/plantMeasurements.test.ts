import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type TestEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PROFILE_ID: string;
  CORS_ORIGIN: string;
};

type SupabaseError = { message: string } | null;

type MeasurementRow = {
  id: string;
  profile_id: string;
  plant_id: string;
  height_cm: number | null;
  leaf_count: number | null;
  notes: string | null;
  measured_at: string;
  created_at: string;
};

type SupabaseState = {
  plant: { id: string } | null;
  plantError: SupabaseError;
  insertMeasurement: MeasurementRow | null;
  insertError: SupabaseError;
  listMeasurements: MeasurementRow[];
  listError: SupabaseError;
  insertedPayload: Record<string, unknown> | null;
  accessedTables: string[];
  listOrder: { column: string; ascending: boolean } | null;
};

const testEnv: TestEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  PROFILE_ID: 'test-profile',
  CORS_ORIGIN: 'http://localhost:3000',
};

const supabaseState: SupabaseState = {
  plant: null,
  plantError: null,
  insertMeasurement: null,
  insertError: null,
  listMeasurements: [],
  listError: null,
  insertedPayload: null,
  accessedTables: [],
  listOrder: null,
};

const getSupabaseMock = vi.fn(() => ({
  from: (table: string) => {
    supabaseState.accessedTables.push(table);

    if (table === 'plants') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: supabaseState.plant,
                error: supabaseState.plantError,
              }),
            }),
          }),
        }),
      };
    }

    if (table === 'measurements') {
      return {
        insert: (payload: Record<string, unknown>) => {
          supabaseState.insertedPayload = payload;
          return {
            select: () => ({
              single: async () => ({
                data: supabaseState.insertMeasurement,
                error: supabaseState.insertError,
              }),
            }),
          };
        },
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: async (column: string, options: { ascending: boolean }) => {
                supabaseState.listOrder = { column, ascending: options.ascending };
                return {
                  data: supabaseState.listMeasurements,
                  error: supabaseState.listError,
                };
              },
            }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table access: ${table}`);
  },
}));

vi.mock('../src/lib/supabase', () => ({
  getSupabase: (...args: unknown[]) => getSupabaseMock(...args),
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
  supabaseState.plant = null;
  supabaseState.plantError = null;
  supabaseState.insertMeasurement = null;
  supabaseState.insertError = null;
  supabaseState.listMeasurements = [];
  supabaseState.listError = null;
  supabaseState.insertedPayload = null;
  supabaseState.accessedTables = [];
  supabaseState.listOrder = null;

  getSupabaseMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('plant measurements endpoints', () => {
  it('POST /plants/:id/measurements returns 400 for invalid JSON body', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plants/plant-1/measurements',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{',
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plants/:id/measurements returns 400 when useful data is missing', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plants/plant-1/measurements',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ measured_at: '2026-03-08T12:00:00Z' }),
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plants/:id/measurements returns 400 when height_cm is negative', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plants/plant-1/measurements',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ height_cm: -1 }),
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plants/:id/measurements returns 400 when leaf_count is negative', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plants/plant-1/measurements',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaf_count: -3 }),
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plants/:id/measurements returns 400 when leaf_count is not an integer', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plants/plant-1/measurements',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaf_count: 2.5 }),
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plants/:id/measurements returns 400 when measured_at is invalid', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plants/plant-1/measurements',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ height_cm: 10, measured_at: 'not-a-date' }),
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('POST /plants/:id/measurements returns 404 when plant is not owned by profile', async () => {
    supabaseState.plant = null;

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plants/plant-404/measurements',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ height_cm: 12 }),
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(404);
    expect(getErrorCode(body)).toBe('NOT_FOUND');
  });

  it('POST /plants/:id/measurements inserts into measurements and returns 201 on valid payload', async () => {
    supabaseState.plant = { id: 'plant-1' };
    supabaseState.insertMeasurement = {
      id: 'm-1',
      profile_id: testEnv.PROFILE_ID,
      plant_id: 'plant-1',
      height_cm: 42,
      leaf_count: 7,
      notes: 'Nueva hoja',
      measured_at: '2026-03-08T12:00:00Z',
      created_at: '2026-03-08T12:00:01Z',
    };

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/plants/plant-1/measurements',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          height_cm: 42,
          leaf_count: 7,
          notes: 'Nueva hoja',
          measured_at: '2026-03-08T12:00:00Z',
        }),
      },
      testEnv,
    );

    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      ok: true,
      measurement: {
        id: 'm-1',
        plant_id: 'plant-1',
      },
    });

    expect(supabaseState.accessedTables).toContain('measurements');
    expect(supabaseState.insertedPayload).toEqual({
      profile_id: testEnv.PROFILE_ID,
      plant_id: 'plant-1',
      height_cm: 42,
      leaf_count: 7,
      notes: 'Nueva hoja',
      measured_at: '2026-03-08T12:00:00Z',
    });
  });

  it('GET /plants/:id/measurements returns 404 when plant is not owned by profile', async () => {
    supabaseState.plant = null;

    const { default: app } = await import('../src/index');

    const response = await app.request('/plants/plant-404/measurements', {}, testEnv);
    const body = (await response.json()) as unknown;

    expect(response.status).toBe(404);
    expect(getErrorCode(body)).toBe('NOT_FOUND');
  });

  it('GET /plants/:id/measurements reads from measurements and returns ordered history', async () => {
    supabaseState.plant = { id: 'plant-1' };
    supabaseState.listMeasurements = [
      {
        id: 'm-2',
        profile_id: testEnv.PROFILE_ID,
        plant_id: 'plant-1',
        height_cm: 44,
        leaf_count: 8,
        notes: 'Segunda medicion',
        measured_at: '2026-03-09T12:00:00Z',
        created_at: '2026-03-09T12:00:01Z',
      },
      {
        id: 'm-1',
        profile_id: testEnv.PROFILE_ID,
        plant_id: 'plant-1',
        height_cm: 42,
        leaf_count: 7,
        notes: 'Primera medicion',
        measured_at: '2026-03-08T12:00:00Z',
        created_at: '2026-03-08T12:00:01Z',
      },
    ];

    const { default: app } = await import('../src/index');

    const response = await app.request('/plants/plant-1/measurements', {}, testEnv);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      measurements: supabaseState.listMeasurements,
    });
    expect(supabaseState.accessedTables).toContain('measurements');
    expect(supabaseState.listOrder).toEqual({
      column: 'measured_at',
      ascending: false,
    });
  });
});
