const BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL
const DEFAULT_TIMEOUT_MS = 15_000

type ApiOk<T> = {
  ok: true
} & T

type ApiFail = {
  ok: false
  error?: {
    code?: string
    message?: string
  }
}

export type APIError = {
  code: string
  message: string
  status?: number
}

export type Plant = {
  id: string
  profile_id: string
  nickname: string
  species_common: string | null
  location: string | null
  light: string | null
  watering_interval_days: number | null
  notes: string | null
  cover_photo_path?: string | null
  cover_photo_url?: string | null
  is_favorite?: boolean
  created_at: string
}

export type PlantPhoto = {
  id: string
  profile_id: string
  plant_id: string
  storage_path: string
  caption: string | null
  taken_at: string | null
  created_at: string
  url: string
}

export type ChatThread = {
  id: string
  profile_id: string
  title: string | null
  created_at: string
}

export type ChatMessage = {
  id: string
  thread_id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
}

export type CareEvent = {
  id: string
  profile_id: string
  plant_id: string
  type: "water" | "fertilize" | "prune" | "repot" | "pest" | "treatment" | "note"
  details: Record<string, unknown> | null
  event_at: string
  created_at: string
}

export type PlantMeasurement = {
  id: string
  profile_id: string
  plant_id: string
  height_cm: number | null
  leaf_count: number | null
  notes: string | null
  measured_at: string
  created_at: string
}

export type CreatePlantMeasurementInput = {
  height_cm?: number
  leaf_count?: number
  notes?: string
  measured_at?: string
}

export type WeatherResponse = {
  temperature_c: number
  temperature_f: number
  rain_probability: number
  wind_speed: number
  humidity: number
  weather_code: number
  is_day: 0 | 1
  condition: "sunny" | "clear-night" | "cloudy" | "rain"
  condition_label: string
  current_time?: string | null
}

export type DiagnosePlantPhotoInput = {
  plant_id: string
  photo_url: string
}

export type DiagnosePlantPhotoResponse = {
  diagnosis_id: string
  possible_causes: string[]
  action_plan: string[]
  confirmation_questions: string[]
}

export type WeeklyPlanTask = {
  task_id: string
  plant_id: string | null
  plant_name: string
  kind: string
  title: string
  reason: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending"
}

export type GenerateWeeklyPlanInput = {
  profile_id: string
}

export type WeeklyPlanResponse = {
  week_start: string
  tasks: WeeklyPlanTask[]
}

function getBaseUrl(): string {
  if (!BASE_URL) {
    throw {
      code: "CONFIG_ERROR",
      message:
        "NEXT_PUBLIC_WORKER_URL no esta definido. Configuralo en apps/web/.env.local"
    } satisfies APIError
  }

  return BASE_URL
}

export function isAPIError(error: unknown): error is APIError {
  if (!error || typeof error !== "object") {
    return false
  }

  const maybeError = error as Partial<APIError>
  return typeof maybeError.code === "string" && typeof maybeError.message === "string"
}

function createAPIError(
  code: string,
  message: string,
  status?: number
): APIError {
  return { code, message, status }
}

type RequestOptions = RequestInit & {
  timeoutMs?: number
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options ?? {}
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  const onExternalAbort = () => {
    controller.abort()
  }

  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort()
    } else {
      init.signal.addEventListener("abort", onExternalAbort, { once: true })
    }
  }

  try {
    const headers = new Headers(init.headers)
    headers.set("Accept", "application/json")

    const method = (init.method ?? "GET").toUpperCase()
    if (
      method !== "GET" &&
      init.body != null &&
      !(init.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json")
    }

    const requestUrl = path.startsWith("/api/") ? path : `${getBaseUrl()}${path}`

    const res = await fetch(requestUrl, {
      ...init,
      cache: "no-store",
      headers,
      signal: controller.signal
    })

    const data = (await res.json().catch(() => null)) as ApiOk<T> | ApiFail | null

    if (!res.ok) {
      const workerCode = data && "error" in data ? data.error?.code : undefined
      const workerMessage = data && "error" in data ? data.error?.message : undefined

      throw createAPIError(
        workerCode ?? `HTTP_${res.status}`,
        workerMessage ?? `La solicitud fallo con estado ${res.status}.`,
        res.status
      )
    }

    if (data && "ok" in data && data.ok === false) {
      throw createAPIError(
        data.error?.code ?? "API_ERROR",
        data.error?.message ?? "Ocurrio un error al procesar la solicitud.",
        res.status
      )
    }

    if (!data) {
      throw createAPIError(
        "INVALID_RESPONSE",
        "El servidor devolvio una respuesta invalida.",
        res.status
      )
    }

    return data as T
  } catch (error: unknown) {
    if (isAPIError(error)) {
      throw error
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw createAPIError(
        "TIMEOUT",
        "La solicitud tardo demasiado. Intenta de nuevo."
      )
    }

    throw createAPIError(
      "NETWORK_ERROR",
      "No se pudo conectar con el servidor. Intenta de nuevo."
    )
  } finally {
    clearTimeout(timeoutId)

    if (init.signal) {
      init.signal.removeEventListener("abort", onExternalAbort)
    }
  }
}

export async function getPlants(): Promise<Plant[]> {
  const data = await request<ApiOk<{ plants: Plant[] }>>("/plants")
  return data.plants ?? []
}

export async function createPlant(input: {
  nickname: string
  species_common?: string
  location?: string
  light?: string
  watering_interval_days?: number | null
  notes?: string
}): Promise<Plant> {
  const data = await request<ApiOk<{ plant: Plant }>>("/plants", {
    method: "POST",
    body: JSON.stringify(input)
  })

  return data.plant
}

export async function getPlantById(plantId: string): Promise<Plant> {
  const encodedPlantId = encodeURIComponent(plantId)
  const data = await request<ApiOk<{ plant: Plant }>>(`/plants/${encodedPlantId}`)

  if (!data.plant) {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio la planta solicitada."
    )
  }

  return data.plant
}

export async function patchPlant(
  plantId: string,
  input: { nickname?: string; cover_photo_path?: string | null; is_favorite?: boolean }
): Promise<Plant> {
  const encodedPlantId = encodeURIComponent(plantId)
  const data = await request<ApiOk<{ plant: Plant }>>(
    `/plants/${encodedPlantId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  )

  if (!data.plant) {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio la planta actualizada."
    )
  }

  return data.plant
}

export async function getPlantEvents(
  plantId: string,
  limit = 30
): Promise<CareEvent[]> {
  const normalizedLimit = Math.min(Math.max(Math.trunc(limit), 1), 50)
  const encodedPlantId = encodeURIComponent(plantId)
  const data = await request<ApiOk<{ events: CareEvent[] }>>(
    `/plants/${encodedPlantId}/events?limit=${normalizedLimit}`
  )

  if (!Array.isArray(data.events)) {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio los eventos de la planta."
    )
  }

  return data.events
}

export async function createPlantEvent(
  plantId: string,
  input: {
    type: CareEvent["type"]
    details?: Record<string, unknown>
    event_at?: string
  }
): Promise<CareEvent> {
  const encodedPlantId = encodeURIComponent(plantId)
  const data = await request<ApiOk<{ event: CareEvent }>>(
    `/plants/${encodedPlantId}/events`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  )

  if (!data.event) {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio el evento registrado."
    )
  }

  return data.event
}

export async function deletePlantEvent(eventId: string): Promise<void> {
  const encodedEventId = encodeURIComponent(eventId)
  await request<ApiOk<Record<string, never>>>(`/events/${encodedEventId}`, {
    method: "DELETE"
  })
}

export async function createPlantMeasurement(
  plantId: string,
  input: CreatePlantMeasurementInput
): Promise<{ measurement: PlantMeasurement }> {
  const encodedPlantId = encodeURIComponent(plantId)
  const data = await request<ApiOk<{ measurement: PlantMeasurement }>>(
    `/plants/${encodedPlantId}/measurements`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  )

  if (!data.measurement) {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio la medicion registrada."
    )
  }

  return { measurement: data.measurement }
}

export async function getPlantMeasurements(
  plantId: string
): Promise<{ measurements: PlantMeasurement[] }> {
  const encodedPlantId = encodeURIComponent(plantId)
  const data = await request<ApiOk<{ measurements: PlantMeasurement[] }>>(
    `/plants/${encodedPlantId}/measurements`
  )

  if (!Array.isArray(data.measurements)) {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio las mediciones de la planta."
    )
  }

  return { measurements: data.measurements }
}

export async function getPlantPhotos(plantId: string): Promise<PlantPhoto[]> {
  const encodedPlantId = encodeURIComponent(plantId)
  const data = await request<ApiOk<{ photos: PlantPhoto[] }>>(
    `/plants/${encodedPlantId}/photos`
  )

  if (!Array.isArray(data.photos)) {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio las fotos de la planta."
    )
  }

  return data.photos
}

export async function uploadPlantPhoto(
  plantId: string,
  input: {
    file: File
    caption?: string
    taken_at?: string
  }
): Promise<PlantPhoto> {
  const encodedPlantId = encodeURIComponent(plantId)
  const formData = new FormData()
  formData.set("file", input.file)

  const caption = input.caption?.trim()
  if (caption) {
    formData.set("caption", caption)
  }

  const takenAt = input.taken_at?.trim()
  if (takenAt) {
    formData.set("taken_at", takenAt)
  }

  const data = await request<ApiOk<{ photo: PlantPhoto }>>(
    `/plants/${encodedPlantId}/photos`,
    {
      method: "POST",
      body: formData
    }
  )

  if (!data.photo) {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio la foto registrada."
    )
  }

  return data.photo
}

export async function deletePlantPhoto(photoId: string): Promise<void> {
  const encodedPhotoId = encodeURIComponent(photoId)
  await request<ApiOk<Record<string, never>>>(`/photos/${encodedPhotoId}`, {
    method: "DELETE"
  })
}

export async function deletePlant(plantId: string): Promise<void> {
  const encodedPlantId = encodeURIComponent(plantId)
  await request<ApiOk<Record<string, never>>>(`/plants/${encodedPlantId}`, {
    method: "DELETE"
  })
}

export async function getThreads(): Promise<ChatThread[]> {
  const data = await request<ApiOk<{ threads: ChatThread[] }>>("/chat/threads")
  return data.threads ?? []
}

export async function getThreadMessages(threadId: string): Promise<ChatMessage[]> {
  const data = await request<ApiOk<{ messages: ChatMessage[] }>>(
    `/chat/threads/${threadId}`
  )
  return data.messages ?? []
}

export async function sendChatMessage(input: {
  message: string
  thread_id?: string
}): Promise<{ thread_id: string; reply: string }> {
  const data = await request<ApiOk<{ thread_id: string; reply: string }>>(
    "/api/toni",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  )

  return {
    thread_id: data.thread_id,
    reply: data.reply
  }
}

export async function sendPlantChatMessage(
  plantId: string,
  message: string
): Promise<{ thread_id: string; message: string }> {
  const encodedPlantId = encodeURIComponent(plantId)
  const data = await request<ApiOk<{ thread_id: string; message: string }>>(
    `/plants/${encodedPlantId}/chat/send`,
    {
      method: "POST",
      body: JSON.stringify({ message })
    }
  )

  return {
    thread_id: data.thread_id,
    message: data.message
  }
}

export async function getWeather(): Promise<WeatherResponse> {
  return request("/weather")
}

export async function diagnosePlantPhoto(
  input: DiagnosePlantPhotoInput
): Promise<DiagnosePlantPhotoResponse> {
  const data = await request<ApiOk<DiagnosePlantPhotoResponse>>("/diagnose", {
    method: "POST",
    body: JSON.stringify(input)
  })

  if (!data.diagnosis_id || typeof data.diagnosis_id !== "string") {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio el identificador del diagnostico."
    )
  }

  return {
    diagnosis_id: data.diagnosis_id,
    possible_causes: Array.isArray(data.possible_causes) ? data.possible_causes : [],
    action_plan: Array.isArray(data.action_plan) ? data.action_plan : [],
    confirmation_questions: Array.isArray(data.confirmation_questions)
      ? data.confirmation_questions
      : []
  }
}

export async function generateWeeklyPlan(
  input: GenerateWeeklyPlanInput
): Promise<WeeklyPlanResponse> {
  const data = await request<ApiOk<WeeklyPlanResponse>>("/plan/generate", {
    method: "POST",
    body: JSON.stringify(input)
  })

  if (!data.week_start || typeof data.week_start !== "string") {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio el inicio de semana del plan."
    )
  }

  if (!Array.isArray(data.tasks)) {
    throw createAPIError(
      "INVALID_RESPONSE",
      "El servidor no devolvio las tareas del plan semanal."
    )
  }

  return {
    week_start: data.week_start,
    tasks: data.tasks
  }
}
