import { Hono } from 'hono';

import { jsonError, jsonOk, safeParseJson } from '../lib/http';
import { getSupabase } from '../lib/supabase';
import { PlantNotFoundError, sendPlantChatMessage } from '../services/chat';
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

type PlantChatSendInput = {
	message?: unknown;
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

function asOptionalString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	return value;
}

const STORAGE_BUCKET = 'plant-photos';
const SIGNED_URL_EXPIRY_SECONDS = 3600;

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

		const rows = (plants ?? []) as Record<string, unknown>[];

		const enriched = await Promise.all(
			rows.map(async (plant) => {
				const coverPath =
					typeof plant.cover_photo_path === 'string' && plant.cover_photo_path.length > 0
						? plant.cover_photo_path
						: null;

				if (!coverPath) {
					return { ...plant, cover_photo_url: null };
				}

				try {
					const { data: signed, error: signErr } = await supabase.storage
						.from(STORAGE_BUCKET)
						.createSignedUrl(coverPath, SIGNED_URL_EXPIRY_SECONDS);

					if (signErr || !signed?.signedUrl) {
						return { ...plant, cover_photo_url: null };
					}

					return { ...plant, cover_photo_url: signed.signedUrl };
				} catch {
					return { ...plant, cover_photo_url: null };
				}
			}),
		);

		return jsonOk(c, { plants: enriched, cover_photo_url_ttl_seconds: SIGNED_URL_EXPIRY_SECONDS }, 200);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return jsonError(c, 'DB_ERROR', 'No se pudo obtener las plantas.', 500, {
			hint: message,
		});
	}
});

plantsRoutes.get('/plants/:id', async (c) => {
	const plantId = c.req.param('id');

	try {
		const supabase = getSupabase(c.env);
		const { data: plant, error } = await supabase
			.from('plants')
			.select('*')
			.eq('id', plantId)
			.eq('profile_id', c.env.PROFILE_ID)
			.maybeSingle();

		if (error) {
			return jsonError(c, 'DB_ERROR', 'No se pudo obtener la planta.', 500, {
				hint: error.message,
			});
		}

		if (!plant) {
			return jsonError(c, 'NOT_FOUND', 'Planta no encontrada.', 404);
		}

		const row = plant as Record<string, unknown>;
		const coverPath =
			typeof row.cover_photo_path === 'string' && row.cover_photo_path.length > 0
				? row.cover_photo_path
				: null;

		if (!coverPath) {
			return jsonOk(c, { plant: { ...row, cover_photo_url: null } });
		}

		try {
			const { data: signed, error: signErr } = await supabase.storage
				.from(STORAGE_BUCKET)
				.createSignedUrl(coverPath, SIGNED_URL_EXPIRY_SECONDS);

			if (signErr || !signed?.signedUrl) {
				return jsonOk(c, { plant: { ...row, cover_photo_url: null } });
			}

			return jsonOk(c, { plant: { ...row, cover_photo_url: signed.signedUrl } });
		} catch {
			return jsonOk(c, { plant: { ...row, cover_photo_url: null } });
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return jsonError(c, 'DB_ERROR', 'No se pudo obtener la planta.', 500, {
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

plantsRoutes.patch('/plants/:id', async (c) => {
	const plantId = c.req.param('id');

	const parsedBody = await safeParseJson(c);
	const body = asObject(parsedBody);

	const hasNickname = body !== null && 'nickname' in body;
	const hasCover = body !== null && 'cover_photo_path' in body;
	const hasFavorite = body !== null && 'is_favorite' in body;

	if (!hasNickname && !hasCover && !hasFavorite) {
		return jsonError(c, 'VALIDATION_ERROR', 'Se requiere al menos nickname, cover_photo_path o is_favorite.', 400);
	}

	const updateFields: Record<string, unknown> = {};

	// --- nickname validation ---
	if (hasNickname) {
		const rawNickname = body!.nickname;
		if (typeof rawNickname !== 'string') {
			return jsonError(c, 'VALIDATION_ERROR', 'nickname debe ser un string.', 400);
		}
		const trimmed = rawNickname.trim();
		if (trimmed.length < 2 || trimmed.length > 40) {
			return jsonError(c, 'VALIDATION_ERROR', 'nickname debe tener entre 2 y 40 caracteres.', 400);
		}
		updateFields.nickname = trimmed;
	}

	// --- cover_photo_path validation ---
	if (hasCover) {
		const raw = body!.cover_photo_path;
		const coverPhotoPath = raw === null ? null : normalizeOptionalString(raw);

		if (raw !== null && coverPhotoPath === null) {
			return jsonError(c, 'VALIDATION_ERROR', 'cover_photo_path debe ser un string no vacio o null.', 400);
		}
		updateFields.cover_photo_path = coverPhotoPath;
	}

	// --- is_favorite validation ---
	if (hasFavorite) {
		const rawFavorite = body!.is_favorite;
		if (typeof rawFavorite !== 'boolean') {
			return jsonError(c, 'VALIDATION_ERROR', 'is_favorite debe ser un boolean.', 400);
		}
		updateFields.is_favorite = rawFavorite;
	}

	try {
		const supabase = getSupabase(c.env);
		const { data: plant, error } = await supabase
			.from('plants')
			.update(updateFields)
			.eq('id', plantId)
			.eq('profile_id', c.env.PROFILE_ID)
			.select('*')
			.maybeSingle();

		if (error) {
			return jsonError(c, 'DB_ERROR', 'No se pudo actualizar la planta.', 500, {
				hint: error.message,
			});
		}

		if (!plant) {
			return jsonError(c, 'NOT_FOUND', 'Planta no encontrada.', 404);
		}

		const row = plant as Record<string, unknown>;
		const coverPath =
			typeof row.cover_photo_path === 'string' && row.cover_photo_path.length > 0
				? row.cover_photo_path
				: null;

		if (!coverPath) {
			return jsonOk(c, { plant: { ...row, cover_photo_url: null } });
		}

		try {
			const { data: signed, error: signErr } = await supabase.storage
				.from(STORAGE_BUCKET)
				.createSignedUrl(coverPath, SIGNED_URL_EXPIRY_SECONDS);

			if (signErr || !signed?.signedUrl) {
				return jsonOk(c, { plant: { ...row, cover_photo_url: null } });
			}

			return jsonOk(c, { plant: { ...row, cover_photo_url: signed.signedUrl } });
		} catch {
			return jsonOk(c, { plant: { ...row, cover_photo_url: null } });
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return jsonError(c, 'DB_ERROR', 'No se pudo actualizar la planta.', 500, {
			hint: message,
		});
	}
});

plantsRoutes.post('/plants/:id/chat/send', async (c) => {
	const plantId = c.req.param('id');

	const parsedBody = await safeParseJson(c);
	const body = asObject(parsedBody);
	const input: PlantChatSendInput = body ?? {};

	const rawMessage = asOptionalString(input.message);
	const message = rawMessage?.trim();

	if (!message) {
		return jsonError(c, 'VALIDATION_ERROR', 'message es requerido', 400);
	}

	try {
		const result = await sendPlantChatMessage(message, plantId, c.env);
		return jsonOk(c, {
			thread_id: result.thread_id,
			message: result.reply,
		});
	} catch (error) {
		if (error instanceof PlantNotFoundError) {
			return jsonError(c, 'NOT_FOUND', 'Planta no encontrada.', 404);
		}

		const messageText = error instanceof Error ? error.message : 'Unknown error';
		return jsonError(c, 'DB_ERROR', 'No se pudo enviar el mensaje.', 500, {
			hint: messageText,
		});
	}
});

plantsRoutes.delete('/plants/:id', async (c) => {
	const plantId = c.req.param('id');

	if (!plantId.trim()) {
		return jsonError(c, 'VALIDATION_ERROR', 'plantId es requerido.', 400);
	}

	try {
		const supabase = getSupabase(c.env);

		// 1. Confirm ownership
		const { data: plant, error: selectError } = await supabase
			.from('plants')
			.select('id')
			.eq('id', plantId)
			.eq('profile_id', c.env.PROFILE_ID)
			.maybeSingle();

		if (selectError) {
			return jsonError(c, 'DB_ERROR', 'No se pudo validar la planta.', 500, {
				hint: selectError.message,
			});
		}

		if (!plant) {
			return jsonError(c, 'NOT_FOUND', 'Planta no encontrada.', 404);
		}

		// 2. Get all photos for storage cleanup
		const { data: photos, error: photosError } = await supabase
			.from('plant_photos')
			.select('id, storage_path')
			.eq('plant_id', plantId)
			.eq('profile_id', c.env.PROFILE_ID);

		if (photosError) {
			return jsonError(c, 'DB_ERROR', 'No se pudieron obtener las fotos para limpieza.', 500, {
				hint: photosError.message,
			});
		}

		// 3. Delete storage objects in batch
		const storagePaths = (photos ?? []).map((p) => p.storage_path).filter(Boolean);
		if (storagePaths.length > 0) {
			const { error: storageError } = await supabase.storage
				.from(STORAGE_BUCKET)
				.remove(storagePaths);

			if (storageError) {
				return jsonError(c, 'STORAGE_ERROR', 'No se pudieron eliminar los archivos de fotos.', 500, {
					hint: storageError.message,
				});
			}
		}

		// 4. Delete plant_photos rows
		const { error: deletePhotosError } = await supabase
			.from('plant_photos')
			.delete()
			.eq('plant_id', plantId)
			.eq('profile_id', c.env.PROFILE_ID);

		if (deletePhotosError) {
			return jsonError(c, 'DB_ERROR', 'No se pudieron eliminar las fotos.', 500, {
				hint: deletePhotosError.message,
			});
		}

		// 5. Delete care_events rows
		const { error: deleteEventsError } = await supabase
			.from('care_events')
			.delete()
			.eq('plant_id', plantId)
			.eq('profile_id', c.env.PROFILE_ID);

		if (deleteEventsError) {
			return jsonError(c, 'DB_ERROR', 'No se pudieron eliminar los eventos.', 500, {
				hint: deleteEventsError.message,
			});
		}

		// 6. Delete the plant itself
		const { error: deletePlantError } = await supabase
			.from('plants')
			.delete()
			.eq('id', plantId)
			.eq('profile_id', c.env.PROFILE_ID);

		if (deletePlantError) {
			return jsonError(c, 'DB_ERROR', 'No se pudo eliminar la planta.', 500, {
				hint: deletePlantError.message,
			});
		}

		return jsonOk(c, {});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return jsonError(c, 'DB_ERROR', 'No se pudo eliminar la planta.', 500, {
			hint: message,
		});
	}
});
