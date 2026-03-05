type KVNamespace = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}

export async function kvGetJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key)
  return raw ? (JSON.parse(raw) as T) : null
}

export async function kvSetJson<T>(kv: KVNamespace, key: string, value: T, ttlSec: number) {
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSec })
}

export function stableKey(parts: string[]) {
  // key estable y corto
  return parts.join("|").slice(0, 400)
}
