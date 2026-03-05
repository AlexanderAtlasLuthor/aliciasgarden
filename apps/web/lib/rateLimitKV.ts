type KVNamespace = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}

export async function rateLimitOrThrow(params: {
  kv: KVNamespace
  key: string
  limit: number
  windowSec: number
}) {
  const { kv, key, limit, windowSec } = params
  const raw = await kv.get(key)
  const now = Date.now()

  let data: { count: number; reset: number }
  if (!raw) {
    data = { count: 0, reset: now + windowSec * 1000 }
  } else {
    data = JSON.parse(raw)
    if (now > data.reset) data = { count: 0, reset: now + windowSec * 1000 }
  }

  data.count += 1
  await kv.put(key, JSON.stringify(data), { expirationTtl: windowSec })

  if (data.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((data.reset - now) / 1000))
    const err = new Error("RATE_LIMIT")
    ;(err as any).status = 429
    ;(err as any).retryAfter = retryAfter
    throw err
  }

  return {
    remaining: Math.max(0, limit - data.count),
    resetInSec: Math.max(0, Math.ceil((data.reset - now) / 1000)),
  }
}
