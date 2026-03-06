import { Hono } from 'hono';
import type { Context } from 'hono';

import { jsonError, jsonOk } from '../lib/http';
import { getSupabase } from '../lib/supabase';
import type { Env } from '../types/env';

const STORAGE_BUCKET = 'plant-photos';
const SIGNED_URL_EXPIRY_SECONDS = 3600;
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type PlantPhotoRow = {
  id: string;
  profile_id: string;
  plant_id: string;
  storage_path: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
};

type PlantPhotoInsertPayload = {
  id: string;
  profile_id: string;
  plant_id: string;
  storage_path: string;
  caption: string | null;
  taken_at: string | null;
};

function asOptionalTrimmedString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalTakenAt(value: FormDataEntryValue | null): string | null | 'invalid' {
  const rawValue = asOptionalTrimmedString(value);
  if (!rawValue) {
    return null;
  }

  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    return 'invalid';
  }

  return rawValue;
}

async function ensurePlantOwnership(
  plantId: string,
  c: Context<{ Bindings: Env }>,
): Promise<Response | null> {
  const supabase = getSupabase(c.env);
  const { data: plant, error } = await supabase
    .from('plants')
    .select('id')
    .eq('id', plantId)
    .eq('profile_id', c.env.PROFILE_ID)
    .maybeSingle();

  if (error) {
    return jsonError(c, 'DB_ERROR', 'No se pudo validar la planta.', 500, {
      hint: error.message,
    });
  }

  if (!plant) {
    return jsonError(c, 'NOT_FOUND', 'Planta no encontrada.', 404);
  }

  return null;
}

export const plantPhotosRoutes = new Hono<{ Bindings: Env }>();

plantPhotosRoutes.get('/plants/:id/photos', async (c) => {
  const plantId = c.req.param('id');

  try {
    const ownershipError = await ensurePlantOwnership(plantId, c);
    if (ownershipError) {
      return ownershipError;
    }

    const supabase = getSupabase(c.env);
    const { data: photos, error } = await supabase
      .from('plant_photos')
      .select('*')
      .eq('plant_id', plantId)
      .eq('profile_id', c.env.PROFILE_ID)
      .order('created_at', { ascending: false });

    if (error) {
      return jsonError(c, 'DB_ERROR', 'No se pudieron obtener las fotos.', 500, {
        hint: error.message,
      });
    }

    const photoRows = (photos ?? []) as PlantPhotoRow[];
    const signedPhotos = await Promise.all(
      photoRows.map(async (photo) => {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(photo.storage_path, SIGNED_URL_EXPIRY_SECONDS);

        if (signedError) {
          throw new Error(`No se pudo firmar la URL de la foto ${photo.id}: ${signedError.message}`);
        }

        return {
          ...photo,
          url: signedData.signedUrl,
        };
      }),
    );

    return jsonOk(c, { photos: signedPhotos });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudieron obtener las fotos.', 500, {
      hint: messageText,
    });
  }
});

plantPhotosRoutes.post('/plants/:id/photos', async (c) => {
  const plantId = c.req.param('id');

  try {
    const ownershipError = await ensurePlantOwnership(plantId, c);
    if (ownershipError) {
      return ownershipError;
    }

    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch {
      return jsonError(c, 'VALIDATION_ERROR', 'Body multipart/form-data invalido.', 400);
    }

    const fileValue = formData.get('file');
    if (!(fileValue instanceof File)) {
      return jsonError(c, 'VALIDATION_ERROR', 'file es requerido.', 400);
    }

    const mimeType = fileValue.type;
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return jsonError(c, 'VALIDATION_ERROR', 'Formato no soportado. Usa JPG, PNG o WEBP.', 400);
    }

    if (fileValue.size > MAX_FILE_SIZE_BYTES) {
      return jsonError(c, 'VALIDATION_ERROR', 'El archivo supera el maximo de 8MB.', 400);
    }

    const caption = asOptionalTrimmedString(formData.get('caption'));
    const parsedTakenAt = parseOptionalTakenAt(formData.get('taken_at'));
    if (parsedTakenAt === 'invalid') {
      return jsonError(c, 'VALIDATION_ERROR', 'taken_at invalido.', 400);
    }

    const extension = EXTENSION_BY_MIME[mimeType];
    const photoId = crypto.randomUUID();
    const storagePath = `profile/${c.env.PROFILE_ID}/plants/${plantId}/${photoId}.${extension}`;

    const supabase = getSupabase(c.env);
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileValue, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo subir la foto.', 500, {
        hint: uploadError.message,
      });
    }

    const insertPayload: PlantPhotoInsertPayload = {
      id: photoId,
      profile_id: c.env.PROFILE_ID,
      plant_id: plantId,
      storage_path: storagePath,
      caption,
      taken_at: parsedTakenAt,
    };

    const { data: photo, error: insertError } = await supabase
      .from('plant_photos')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      return jsonError(c, 'DB_ERROR', 'No se pudo guardar la foto.', 500, {
        hint: insertError.message,
      });
    }

    return jsonOk(c, { photo }, 201);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(c, 'DB_ERROR', 'No se pudo subir la foto.', 500, {
      hint: messageText,
    });
  }
});

plantPhotosRoutes.delete('/photos/:photoId', async (c) => {
  const photoId = c.req.param('photoId');

  if (!photoId.trim()) {
    return jsonError(c, 'VALIDATION_ERROR', 'photoId es requerido.', 400);
  }

  const supabase = getSupabase(c.env);

  // 1. Fetch photo row (ownership check via profile_id)
  const { data: photo, error: selectError } = await supabase
    .from('plant_photos')
    .select('id, plant_id, storage_path')
    .eq('id', photoId)
    .eq('profile_id', c.env.PROFILE_ID)
    .maybeSingle();

  if (selectError) {
    return jsonError(c, 'DB_ERROR', 'No se pudo buscar la foto.', 500, {
      hint: selectError.message,
    });
  }

  if (!photo) {
    return jsonError(c, 'NOT_FOUND', 'Foto no encontrada.', 404);
  }

  // 2. Delete object from storage (idempotent: ignore "not found")
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([photo.storage_path]);

  if (storageError) {
    return jsonError(c, 'STORAGE_ERROR', 'No se pudo eliminar el archivo de la foto.', 500, {
      hint: storageError.message,
    });
  }

  // 3. Delete row in plant_photos
  const { error: deleteError } = await supabase
    .from('plant_photos')
    .delete()
    .eq('id', photo.id)
    .eq('profile_id', c.env.PROFILE_ID);

  if (deleteError) {
    return jsonError(c, 'DB_ERROR', 'No se pudo eliminar la foto de la base de datos.', 500, {
      hint: deleteError.message,
    });
  }

  // 4. Clear cover_photo_path if this photo was the cover
  const { error: coverError } = await supabase
    .from('plants')
    .update({ cover_photo_path: null })
    .eq('id', photo.plant_id)
    .eq('profile_id', c.env.PROFILE_ID)
    .eq('cover_photo_path', photo.storage_path);

  if (coverError) {
    return jsonError(c, 'DB_ERROR', 'No se pudo limpiar la portada.', 500, {
      hint: coverError.message,
    });
  }

  return jsonOk(c, {});
});
