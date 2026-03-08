import { generateVisionJsonReply } from './ai';
import type { Env } from '../types/env';

export type DiagnosePlantPhotoInput = {
  photo_url: string;
  plant_nickname?: string | null;
  species_common?: string | null;
};

export type DiagnosePlantPhotoResult = {
  possible_causes: string[];
  action_plan: string[];
  confirmation_questions: string[];
};

type ParsedDiagnosisShape = Partial<{
  possible_causes: unknown;
  action_plan: unknown;
  confirmation_questions: unknown;
  posibles_causas: unknown;
  plan_de_accion: unknown;
  preguntas_de_confirmacion: unknown;
}>;

const EMPTY_DIAGNOSIS: DiagnosePlantPhotoResult = {
  possible_causes: [],
  action_plan: [],
  confirmation_questions: [],
};

const SYSTEM_PROMPT = [
  'Eres Toni, un asistente de jardineria para personas principiantes.',
  'Tu tarea es hacer un diagnostico VISUAL PRELIMINAR de una planta usando una foto.',
  'No hagas afirmaciones absolutas ni diagnosticos medicos definitivos de la planta.',
  'Describe incertidumbre cuando corresponda (por ejemplo: "podria ser", "es posible").',
  'Prioriza recomendaciones seguras y de bajo riesgo.',
  'Responde SOLO JSON valido, sin markdown, sin texto adicional y sin comentarios.',
  'Debes devolver exactamente estas claves:',
  '- possible_causes: string[]',
  '- action_plan: string[]',
  '- confirmation_questions: string[]',
  'Cada lista debe contener frases cortas y accionables.',
].join('\n');

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (!fenced) {
    return trimmed;
  }

  return fenced[1]?.trim() ?? '';
}

function extractJsonObject(raw: string): string | null {
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');

  if (first < 0 || last <= first) {
    return null;
  }

  return raw.slice(first, last + 1);
}

function parseDiagnosisPayload(raw: string): ParsedDiagnosisShape | null {
  const unfenced = stripJsonFence(raw);

  try {
    return asObject(JSON.parse(unfenced)) as ParsedDiagnosisShape | null;
  } catch {
    const extracted = extractJsonObject(unfenced);
    if (!extracted) {
      return null;
    }

    try {
      return asObject(JSON.parse(extracted)) as ParsedDiagnosisShape | null;
    } catch {
      return null;
    }
  }
}

function normalizeDiagnosisPayload(payload: ParsedDiagnosisShape | null): DiagnosePlantPhotoResult {
  if (!payload) {
    return EMPTY_DIAGNOSIS;
  }

  const possibleCauses = normalizeStringArray(
    payload.possible_causes ?? payload.posibles_causas,
  );
  const actionPlan = normalizeStringArray(payload.action_plan ?? payload.plan_de_accion);
  const confirmationQuestions = normalizeStringArray(
    payload.confirmation_questions ?? payload.preguntas_de_confirmacion,
  );

  return {
    possible_causes: possibleCauses,
    action_plan: actionPlan,
    confirmation_questions: confirmationQuestions,
  };
}

function formatOptionalContextLine(label: string, value: string | null | undefined): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    return `- ${label}: sin dato`;
  }

  return `- ${label}: ${normalized}`;
}

function buildUserPrompt(input: DiagnosePlantPhotoInput): string {
  return [
    'Analiza esta foto y devuelve un diagnostico visual preliminar de la planta.',
    'Contexto opcional:',
    formatOptionalContextLine('nickname', input.plant_nickname),
    formatOptionalContextLine('species_common', input.species_common),
    '',
    'Instrucciones de formato:',
    '1) possible_causes: lista de causas probables observables en la foto.',
    '2) action_plan: pasos concretos y seguros para las proximas 24-72 horas.',
    '3) confirmation_questions: preguntas cortas para confirmar el diagnostico.',
    '',
    'No incluyas ningun texto fuera del JSON.',
  ].join('\n');
}

export async function diagnosePlantPhoto(
  input: DiagnosePlantPhotoInput,
  env: Env,
): Promise<DiagnosePlantPhotoResult> {
  const photoUrl = input.photo_url.trim();

  if (!photoUrl) {
    return EMPTY_DIAGNOSIS;
  }

  try {
    const raw = await generateVisionJsonReply(
      {
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildUserPrompt(input),
        imageUrl: photoUrl,
      },
      env,
    );

    return normalizeDiagnosisPayload(parseDiagnosisPayload(raw));
  } catch {
    return EMPTY_DIAGNOSIS;
  }
}
