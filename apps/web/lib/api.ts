const BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL

type ApiOk<T> = {
  ok: true
} & T

type ApiFail = {
  ok: false
  error?: {
    message?: string
  }
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
    throw new Error(
      "NEXT_PUBLIC_WORKER_URL no esta definido. Configuralo en apps/web/.env.local"
    )
  }

  return BASE_URL
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers
  })

  const data = (await res.json().catch(() => null)) as ApiOk<T> | ApiFail | null

  if (!res.ok) {
    const message =
      data && "error" in data && data.error?.message
        ? data.error.message
        : `Request failed with status ${res.status}`

    throw new Error(`${message} (status: ${res.status})`)
  }

  return data as T
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
    "/chat/send",
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
