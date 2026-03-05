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
  created_at: string
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
    if (method !== "GET" && init.body != null && !headers.has("Content-Type")) {
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
