import { getSupabase } from '../lib/supabase';
import { generateReply, type ChatMessage } from './ai';
import type { Env } from '../types/env';

type ChatRole = 'system' | 'user' | 'assistant';

type ChatMessageRow = {
  role: ChatRole;
  content: string;
  created_at: string;
};

type SendChatMessageResult = {
  thread_id: string;
  reply: string;
};

type PlantContextRow = {
  id: string;
  profile_id: string;
  nickname: string;
  species_common: string | null;
  location: string | null;
  light: string | null;
  watering_interval_days: number | null;
  notes: string | null;
  cover_photo_path: string | null;
};

type CareEventRow = {
  type: string;
  details: Record<string, unknown> | null;
  event_at: string;
};

type PlantPhotoRow = {
  taken_at: string | null;
  created_at: string;
};

type ChatThreadRow = {
  id: string;
};

export class PlantNotFoundError extends Error {}

const SYSTEM_PROMPT: ChatMessage = {
  role: 'system',
  content: [
    'Eres Toni 🌿, el asistente de jardinería personal de Alicia (la dueña de Alicia’s Garden).',
    'Tu trabajo es ayudarla a cuidar sus plantas en casa de forma sencilla y constante.',
    '',
    'IDIOMA:',
    '- Responde SIEMPRE en español (neutral, claro y cálido).',
    '',
    'ESTILO:',
    '- Tono: amable, paciente y calmado; evita sonar exagerado o demasiado efusivo.',
    '- Alicia es principiante: evita tecnicismos; si usas uno, explícalo en una frase.',
    '- Sé breve pero útil. No escribas “ensayos”.',
    '- Escribe siempre en texto plano (sin Markdown).',
    '- Evita signos de exclamación repetidos y evita emojis salvo que Alicia los use primero.',
    '',
    'REGLAS DE CALIDAD:',
    '- No inventes datos. Si falta información, pregunta.',
    '- Si hay varias causas posibles, dilo como probabilidades (“podría ser…”).',
    '- Prioriza acciones de bajo riesgo primero.',
    '- No uses **, *, backticks, encabezados Markdown ni listas con viñetas tipo "*".',
    '- Si necesitas lista, usa guiones "-" o numeración "1) 2)".',
    '',
    'FORMATO OBLIGATORIO EN CADA RESPUESTA:',
    '1) Una frase corta y tranquilizadora.',
    '2) 3–6 pasos en viñetas (acciones concretas).',
    '3) Exactamente 1 pregunta final para afinar el diagnóstico.',
    '',
    'CONTEXTO DE PRODUCTO:',
    '- Si Alicia menciona una planta por nombre (nickname), úsalo en la respuesta.',
    '- Si la pregunta es sobre riego, luz o plagas, propone un mini-plan de hoy + próximos 3 días.',
    '- Termina de forma breve, humana y serena (sin intensidad alta).',
  ].join('\n'),
};

const OPENAI_FALLBACK_REPLY =
  'Toni esta teniendo problemas tecnicos. Intenta nuevamente.';

function fmt(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'sin dato';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : 'sin dato';
  }

  return String(value);
}

function formatIsoDate(value: string | null): string {
  if (!value) {
    return 'sin fecha';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

function eventDetailsSummary(details: Record<string, unknown> | null): string {
  if (!details) {
    return 'sin detalles';
  }

  const textCandidateKeys = ['text', 'notes', 'note', 'message', 'comment', 'details'];
  for (const key of textCandidateKeys) {
    const candidate = details[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim().slice(0, 140);
    }
  }

  const serialized = JSON.stringify(details);
  if (!serialized || serialized === '{}') {
    return 'sin detalles';
  }

  return serialized.slice(0, 140);
}

function buildPlantContext(
  plant: PlantContextRow,
  events: CareEventRow[],
  latestPhoto: PlantPhotoRow | null,
): string {
  const eventLines =
    events.length === 0
      ? ['- sin eventos recientes']
      : events.map((event) => {
          const details = eventDetailsSummary(event.details);
          return `- ${formatIsoDate(event.event_at)} | ${fmt(event.type)} | ${details}`;
        });

  let photoLine = 'sin fotos registradas';
  if (plant.cover_photo_path && plant.cover_photo_path.trim().length > 0) {
    photoLine = 'La planta tiene foto de portada disponible.';
  } else if (latestPhoto) {
    const referenceDate = latestPhoto.taken_at ?? latestPhoto.created_at;
    photoLine = `Existe una foto reciente tomada el ${formatIsoDate(referenceDate)}.`;
  }

  return [
    'PLANT_CONTEXT:',
    'PLANTA:',
    `- nickname: ${fmt(plant.nickname)}`,
    `- species_common: ${fmt(plant.species_common)}`,
    `- location: ${fmt(plant.location)}`,
    `- light: ${fmt(plant.light)}`,
    `- watering_interval_days: ${fmt(plant.watering_interval_days)}`,
    `- notes: ${fmt(plant.notes)}`,
    'EVENTOS_RECIENTES:',
    ...eventLines,
    'FOTO_RELEVANTE:',
    `- ${photoLine}`,
  ].join('\n');
}

export async function sendChatMessage(
  message: string,
  threadId: string | undefined,
  env: Env,
): Promise<SendChatMessageResult> {
  const supabase = getSupabase(env);

  let effectiveThreadId = threadId;

  if (!effectiveThreadId) {
    const { data: thread, error: createThreadError } = await supabase
      .from('chat_threads')
      .insert({
        profile_id: env.PROFILE_ID,
        title: null,
      })
      .select('id')
      .single();

    if (createThreadError || !thread?.id) {
      throw new Error(
        `Failed to create chat thread: ${createThreadError?.message ?? 'Unknown database error'}`,
      );
    }

    effectiveThreadId = thread.id;
  }

  if (!effectiveThreadId) {
    throw new Error('Failed to resolve chat thread id.');
  }

  const { error: insertUserError } = await supabase.from('chat_messages').insert({
    thread_id: effectiveThreadId,
    role: 'user',
    content: message,
  });

  if (insertUserError) {
    throw new Error(
      `Failed to save user chat message: ${insertUserError.message}`,
    );
  }

  const { data: historyRows, error: historyError } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('thread_id', effectiveThreadId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (historyError) {
    throw new Error(`Failed to load chat history: ${historyError.message}`);
  }

  const history: ChatMessage[] = (historyRows as ChatMessageRow[])
    .slice()
    .reverse()
    .map((row) => ({
      role: row.role,
      content: row.content,
    }));

  const aiMessages: ChatMessage[] = [SYSTEM_PROMPT, ...history];

  let reply: string;

  try {
    reply = await generateReply(aiMessages, env);
  } catch {
    reply = OPENAI_FALLBACK_REPLY;
  }

  const { error: insertAssistantError } = await supabase.from('chat_messages').insert({
    thread_id: effectiveThreadId,
    role: 'assistant',
    content: reply,
  });

  if (insertAssistantError) {
    throw new Error(
      `Failed to save assistant chat message: ${insertAssistantError.message}`,
    );
  }

  return {
    thread_id: effectiveThreadId,
    reply,
  };
}

export async function sendPlantChatMessage(
  message: string,
  plantId: string,
  env: Env,
): Promise<SendChatMessageResult> {
  const supabase = getSupabase(env);

  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id, profile_id, nickname, species_common, location, light, watering_interval_days, notes, cover_photo_path')
    .eq('id', plantId)
    .eq('profile_id', env.PROFILE_ID)
    .maybeSingle();

  if (plantError) {
    throw new Error(`Failed to load plant for contextual chat: ${plantError.message}`);
  }

  if (!plant) {
    throw new PlantNotFoundError('Plant not found for contextual chat.');
  }

  const { data: events, error: eventsError } = await supabase
    .from('care_events')
    .select('type, details, event_at')
    .eq('plant_id', plantId)
    .eq('profile_id', env.PROFILE_ID)
    .order('event_at', { ascending: false })
    .limit(5);

  if (eventsError) {
    throw new Error(`Failed to load plant events for contextual chat: ${eventsError.message}`);
  }

  const { data: latestPhotos, error: photosError } = await supabase
    .from('plant_photos')
    .select('taken_at, created_at')
    .eq('plant_id', plantId)
    .eq('profile_id', env.PROFILE_ID)
    .order('created_at', { ascending: false })
    .limit(1);

  if (photosError) {
    throw new Error(`Failed to load plant photos for contextual chat: ${photosError.message}`);
  }

  const plantContext = buildPlantContext(
    plant as PlantContextRow,
    (events ?? []) as CareEventRow[],
    ((latestPhotos ?? [])[0] ?? null) as PlantPhotoRow | null,
  );

  let effectiveThreadId: string;
  const { data: existingThread, error: threadLookupError } = await supabase
    .from('chat_threads')
    .select('id')
    .eq('profile_id', env.PROFILE_ID)
    .eq('plant_id', plantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (threadLookupError) {
    throw new Error(`Failed to lookup plant chat thread: ${threadLookupError.message}`);
  }

  if (existingThread?.id) {
    effectiveThreadId = (existingThread as ChatThreadRow).id;
  } else {
    const { data: createdThread, error: createThreadError } = await supabase
      .from('chat_threads')
      .insert({
        profile_id: env.PROFILE_ID,
        plant_id: plantId,
        title: null,
      })
      .select('id')
      .single();

    if (createThreadError || !createdThread?.id) {
      throw new Error(
        `Failed to create plant chat thread: ${createThreadError?.message ?? 'Unknown database error'}`,
      );
    }

    effectiveThreadId = createdThread.id;
  }

  const { error: insertUserError } = await supabase.from('chat_messages').insert({
    thread_id: effectiveThreadId,
    role: 'user',
    content: message,
  });

  if (insertUserError) {
    throw new Error(
      `Failed to save user contextual chat message: ${insertUserError.message}`,
    );
  }

  const { data: historyRows, error: historyError } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('thread_id', effectiveThreadId)
    .order('created_at', { ascending: false })
    .limit(12);

  if (historyError) {
    throw new Error(`Failed to load contextual chat history: ${historyError.message}`);
  }

  const history: ChatMessage[] = (historyRows as ChatMessageRow[])
    .slice()
    .reverse()
    .map((row) => ({
      role: row.role,
      content: row.content,
    }));

  const aiMessages: ChatMessage[] = [
    SYSTEM_PROMPT,
    {
      role: 'system',
      content: plantContext,
    },
    ...history,
  ];

  let reply: string;

  try {
    reply = await generateReply(aiMessages, env);
  } catch {
    reply = OPENAI_FALLBACK_REPLY;
  }

  const { error: insertAssistantError } = await supabase.from('chat_messages').insert({
    thread_id: effectiveThreadId,
    role: 'assistant',
    content: reply,
  });

  if (insertAssistantError) {
    throw new Error(
      `Failed to save assistant contextual chat message: ${insertAssistantError.message}`,
    );
  }

  return {
    thread_id: effectiveThreadId,
    reply,
  };
}
