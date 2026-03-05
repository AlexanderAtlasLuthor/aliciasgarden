import { Hono } from 'hono';

import { jsonError, jsonOk, safeParseJson } from '../lib/http';
import { getSupabase } from '../lib/supabase';
import type { Env } from '../types/env';

type PlantCreateInput = {
	nickname?: unknown;
	species_common?: unknown;
	location?: unknown;
	light?: unknown;
	watering_interval_days?: unknown;
	notes?: unknown;
};

type PlantInsertPayload = {
	profile_id: string;
	nickname: string;
	species_common: string | null;
	location: string | null;
	light: string | null;
	watering_interval_days: number | null;
	notes: string | null;
};

function asObject(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

function normalizeOptionalString(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalNumber(value: unknown): number | null {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return null;
	}
	return value;
}

export const plantsRoutes = new Hono<{ Bindings: Env }>();

plantsRoutes.get('/plants', async (c) => {
	try {
		const supabase = getSupabase(c.env);
		const { data: plants, error } = await supabase
			.from('plants')
			.select('*')
			.eq('profile_id', c.env.PROFILE_ID)
			.order('created_at', { ascending: false });

		if (error) {
			return jsonError(c, 'DB_ERROR', 'No se pudo obtener las plantas.', 500, {
				hint: error.message,
			});
		}

		return jsonOk(c, { plants: plants ?? [] }, 200);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return jsonError(c, 'DB_ERROR', 'No se pudo obtener las plantas.', 500, {
			hint: message,
		});
	}
});

plantsRoutes.post('/plants', async (c) => {
	const parsedBody = await safeParseJson(c);
	const body = asObject(parsedBody);
	const input: PlantCreateInput = body ?? {};

	const nickname = normalizeOptionalString(input.nickname);
	if (!nickname) {
		return jsonError(c, 'VALIDATION_ERROR', 'nickname es requerido', 400);
	}

	const payload: PlantInsertPayload = {
		profile_id: c.env.PROFILE_ID,
		nickname,
		species_common: normalizeOptionalString(input.species_common),
		location: normalizeOptionalString(input.location),
		light: normalizeOptionalString(input.light),
		watering_interval_days: normalizeOptionalNumber(input.watering_interval_days),
		notes: normalizeOptionalString(input.notes),
	};

	try {
		const supabase = getSupabase(c.env);
		const { data: plant, error } = await supabase
			.from('plants')
			.insert(payload)
			.select('*')
			.single();

		if (error) {
			return jsonError(c, 'DB_ERROR', 'No se pudo guardar la planta.', 500, {
				hint: error.message,
			});
		}

		return jsonOk(c, { plant }, 201);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return jsonError(c, 'DB_ERROR', 'No se pudo guardar la planta.', 500, {
			hint: message,
		});
	}
});
