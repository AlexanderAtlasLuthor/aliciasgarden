import { afterEach, describe, expect, it, vi } from 'vitest'

import app from '../src/index'

const testEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  PROFILE_ID: 'test-profile',
  CORS_ORIGIN: 'http://localhost:3000',
}

function getErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined
  }

  const maybeBody = body as {
    code?: unknown
    error?: { code?: unknown }
  }

  if (typeof maybeBody.code === 'string') {
    return maybeBody.code
  }

  if (maybeBody.error && typeof maybeBody.error.code === 'string') {
    return maybeBody.error.code
  }

  return undefined
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GET /weather', () => {
  it('returns normalized weather data on valid external response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          current: {
            time: '2026-03-07T10:00',
            temperature_2m: 23,
            relative_humidity_2m: 62,
            wind_speed_10m: 10,
            weather_code: 3,
            is_day: 1,
          },
          hourly: {
            time: ['2026-03-07T09:00', '2026-03-07T10:00'],
            precipitation_probability: [35, 40],
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    const response = await app.request('/weather', {}, testEnv)
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      temperature_c: 23,
      temperature_f: 73.4,
      rain_probability: 40,
      wind_speed: 10,
      humidity: 62,
      weather_code: 3,
      is_day: 1,
      condition: 'cloudy',
      condition_label: 'Parcialmente nublado',
      current_time: '2026-03-07T10:00',
    })
  })

  it('returns clear-night when weather is clear and is_day is 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          current: {
            time: '2026-03-07T23:00',
            temperature_2m: 19,
            relative_humidity_2m: 50,
            wind_speed_10m: 6,
            weather_code: 1,
            is_day: 0,
          },
          hourly: {
            time: ['2026-03-07T23:00'],
            precipitation_probability: [8],
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    const response = await app.request('/weather', {}, testEnv)
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      condition: 'clear-night',
      condition_label: 'Despejado',
      is_day: 0,
    })
  })

  it('returns WEATHER_FETCH_FAILED when external API responds with non-ok status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    )

    const response = await app.request('/weather', {}, testEnv)
    const body = (await response.json()) as unknown

    expect(response.status).toBe(500)
    expect(body).toMatchObject({
      ok: false,
    })
    expect(getErrorCode(body)).toBe('WEATHER_FETCH_FAILED')
  })

  it('returns WEATHER_INVALID_RESPONSE when external payload is invalid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    )

    const response = await app.request('/weather', {}, testEnv)
    const body = (await response.json()) as unknown

    expect(response.status).toBe(500)
    expect(body).toMatchObject({
      ok: false,
    })
    expect(getErrorCode(body)).toBe('WEATHER_INVALID_RESPONSE')
  })
})
