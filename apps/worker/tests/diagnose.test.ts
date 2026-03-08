import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type PlantRow = {
  id: string;
  nickname: string;
  species_common: string | null;
};

type TestEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PROFILE_ID: string;
  CORS_ORIGIN: string;
};

type SupabaseState = {
  plant: PlantRow | null;
  plantError: { message: string } | null;
  insertData: { id: string } | null;
  insertError: { message: string } | null;
  insertedDiagnosisPayload: Record<string, unknown> | null;
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
  insertData: null,
  insertError: null,
  insertedDiagnosisPayload: null,
};

const diagnoseResult = {
  possible_causes: ['Falta de riego'],
  action_plan: ['Revisar humedad y regar ligero'],
  confirmation_questions: ['¿Las hojas se sienten secas al tacto?'],
};

const getSupabaseMock = vi.fn(() => ({
  from: (table: string) => {
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

    if (table === 'diagnoses') {
      return {
        insert: (payload: Record<string, unknown>) => {
          supabaseState.insertedDiagnosisPayload = payload;
          return {
            select: () => ({
              single: async () => ({
                data: supabaseState.insertData,
                error: supabaseState.insertError,
              }),
            }),
          };
        },
      };
    }

    throw new Error(`Unexpected table access: ${table}`);
  },
}));

const diagnosePlantPhotoMock = vi.fn(async () => diagnoseResult);

vi.mock('../src/lib/supabase', () => ({
  getSupabase: (...args: unknown[]) => getSupabaseMock(...args),
}));

vi.mock('../src/services/diagnose', () => ({
  diagnosePlantPhoto: (...args: unknown[]) => diagnosePlantPhotoMock(...args),
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
  supabaseState.insertData = null;
  supabaseState.insertError = null;
  supabaseState.insertedDiagnosisPayload = null;

  getSupabaseMock.mockClear();
  diagnosePlantPhotoMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /diagnose', () => {
  it('returns 400 when body is invalid JSON', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/diagnose',
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

  it('returns 400 when plant_id is missing', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/diagnose',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo_url: 'https://example.com/photo.jpg' }),
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when photo_url is missing', async () => {
    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/diagnose',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plant_id: 'plant-1' }),
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(getErrorCode(body)).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when plant does not exist for profile', async () => {
    supabaseState.plant = null;

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/diagnose',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plant_id: 'plant-not-found',
          photo_url: 'https://example.com/photo.jpg',
        }),
      },
      testEnv,
    );

    const body = (await response.json()) as unknown;

    expect(response.status).toBe(404);
    expect(getErrorCode(body)).toBe('NOT_FOUND');
    expect(diagnosePlantPhotoMock).not.toHaveBeenCalled();
  });

  it('returns diagnosis payload and persists in diagnoses on valid input', async () => {
    supabaseState.plant = {
      id: 'plant-1',
      nickname: 'Monstera',
      species_common: 'Monstera deliciosa',
    };
    supabaseState.insertData = { id: 'diag-123' };

    const { default: app } = await import('../src/index');

    const response = await app.request(
      '/diagnose',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plant_id: 'plant-1',
          photo_url: 'https://example.com/photo.jpg',
        }),
      },
      testEnv,
    );

    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      diagnosis_id: 'diag-123',
      possible_causes: diagnoseResult.possible_causes,
      action_plan: diagnoseResult.action_plan,
      confirmation_questions: diagnoseResult.confirmation_questions,
    });

    expect(diagnosePlantPhotoMock).toHaveBeenCalledTimes(1);

    expect(supabaseState.insertedDiagnosisPayload).toEqual({
      profile_id: testEnv.PROFILE_ID,
      plant_id: 'plant-1',
      photo_url: 'https://example.com/photo.jpg',
      possible_causes: diagnoseResult.possible_causes,
      action_plan: diagnoseResult.action_plan,
      confirmation_questions: diagnoseResult.confirmation_questions,
    });
  });
});
