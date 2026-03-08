import { Hono } from 'hono';

import { jsonError, jsonOk } from '../lib/http';
import type { Env } from '../types/env';

type WeatherCondition = 'sunny' | 'clear-night' | 'cloudy' | 'rain';

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    is_day?: number;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
  };
};

type WeatherPresentation = {
  condition: WeatherCondition;
  conditionLabel: string;
};

function mapWeatherCodeToPresentation(weatherCode: number, isDay: number): WeatherPresentation {
  if (weatherCode >= 0 && weatherCode <= 1) {
    if (isDay === 0) {
      return {
        condition: 'clear-night',
        conditionLabel: 'Despejado',
      };
    }

    return {
      condition: 'sunny',
      conditionLabel: 'Soleado',
    };
  }

  if (weatherCode >= 2 && weatherCode <= 3) {
    return {
      condition: 'cloudy',
      conditionLabel: 'Parcialmente nublado',
    };
  }

  if (weatherCode >= 45 && weatherCode <= 48) {
    return {
      condition: 'cloudy',
      conditionLabel: 'Nublado',
    };
  }

  if (weatherCode >= 51 && weatherCode <= 67) {
    return {
      condition: 'rain',
      conditionLabel: 'Lluvioso',
    };
  }

  if (weatherCode >= 71 && weatherCode <= 77) {
    return {
      condition: 'cloudy',
      conditionLabel: 'Nublado',
    };
  }

  if (weatherCode >= 80) {
    return {
      condition: 'rain',
      conditionLabel: 'Lluvioso',
    };
  }

  return {
    condition: 'cloudy',
    conditionLabel: 'Nublado',
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toFahrenheit(temperatureC: number): number {
  return (temperatureC * 9) / 5 + 32;
}

function resolveRainProbability(data: OpenMeteoResponse, currentTime: string | undefined): number | null {
  const probabilities = data.hourly?.precipitation_probability;
  if (!Array.isArray(probabilities) || probabilities.length === 0) {
    return null;
  }

  if (!currentTime) {
    const first = probabilities[0];
    return isFiniteNumber(first) ? first : null;
  }

  const hourlyTimes = data.hourly?.time;
  if (Array.isArray(hourlyTimes)) {
    const index = hourlyTimes.indexOf(currentTime);
    if (index >= 0 && index < probabilities.length) {
      const candidate = probabilities[index];
      return isFiniteNumber(candidate) ? candidate : null;
    }
  }

  const first = probabilities[0];
  return isFiniteNumber(first) ? first : null;
}

export const weatherRoutes = new Hono<{ Bindings: Env }>();

weatherRoutes.get('/weather', async (c) => {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=32.2177&longitude=-82.4135&timezone=America%2FNew_York&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=precipitation_probability';

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch {
    return jsonError(c, 'WEATHER_FETCH_FAILED', 'No se pudo consultar el clima.', 500);
  }

  if (!response.ok) {
    return jsonError(c, 'WEATHER_FETCH_FAILED', 'No se pudo consultar el clima.', 500);
  }

  let data: OpenMeteoResponse;

  try {
    data = (await response.json()) as OpenMeteoResponse;
  } catch {
    return jsonError(c, 'WEATHER_INVALID_RESPONSE', 'Respuesta de clima invalida.', 500);
  }

  const temperatureC = data.current?.temperature_2m;
  const humidity = data.current?.relative_humidity_2m;
  const windSpeed = data.current?.wind_speed_10m;
  const weatherCode = data.current?.weather_code;
  const isDay = data.current?.is_day;
  const currentTime = data.current?.time;
  const rainProbability = resolveRainProbability(data, currentTime);

  if (
    !isFiniteNumber(temperatureC) ||
    !isFiniteNumber(humidity) ||
    !isFiniteNumber(windSpeed) ||
    !isFiniteNumber(weatherCode) ||
    !isFiniteNumber(isDay) ||
    (isDay !== 0 && isDay !== 1) ||
    !isFiniteNumber(rainProbability)
  ) {
    return jsonError(c, 'WEATHER_INVALID_RESPONSE', 'Respuesta de clima invalida.', 500);
  }

  const presentation = mapWeatherCodeToPresentation(weatherCode, isDay);
  const temperatureF = toFahrenheit(temperatureC);

  return jsonOk(c, {
    temperature_c: temperatureC,
    temperature_f: temperatureF,
    rain_probability: rainProbability,
    wind_speed: windSpeed,
    humidity,
    weather_code: weatherCode,
    is_day: isDay,
    condition: presentation.condition,
    condition_label: presentation.conditionLabel,
    current_time: typeof currentTime === 'string' ? currentTime : null,
  });
});
