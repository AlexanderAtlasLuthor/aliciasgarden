import { kvGetJson, kvSetJson, stableKey } from "@/lib/cacheKV"
import { rateLimitOrThrow } from "@/lib/rateLimitKV"

export const runtime = "edge"

type Env = {
  AG_RATE_LIMIT: {
    get(key: string): Promise<string | null>
    put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
  }
  AG_TONI_CACHE: {
    get(key: string): Promise<string | null>
    put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
  }
}

type ChatSendPayload = {
  message: string
  thread_id?: string
  locale?: string
}

type ToniRouteContext = {
  params: Promise<Record<string, string>>
  env?: Env
}

const DEFAULT_ERROR_MESSAGE = "No se pudo completar la solicitud con Toni."

function getWorkerBaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_WORKER_URL ?? null
}

function getClientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
}

export async function POST(req: Request, ctx: ToniRouteContext) {
  const ip = getClientIp(req)

  try {
    let rl: { remaining: number; resetInSec: number } | null = null

    if (ctx?.env?.AG_RATE_LIMIT) {
      rl = await rateLimitOrThrow({
        kv: ctx.env.AG_RATE_LIMIT,
        key: `toni:${ip}`,
        limit: 20,
        windowSec: 60,
      })
    }

    const body = (await req.json().catch(() => null)) as ChatSendPayload | null
    if (!body || typeof body.message !== "string" || body.message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Mensaje invalido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const message = body.message.trim()
    const locale = String(body.locale ?? "es")
    const hasThreadId = typeof body.thread_id === "string" && body.thread_id.trim().length > 0
    const shouldCache =
      hasThreadId &&
      message.length < 180 &&
      !message.toLowerCase().includes("mi planta")
    const cacheKey = stableKey(["toni", locale, message])

    if (shouldCache && ctx?.env?.AG_TONI_CACHE) {
      const cached = await kvGetJson<{ answer: string }>(ctx.env.AG_TONI_CACHE, cacheKey)
      if (cached?.answer) {
        const responseHeaders = new Headers({ "Content-Type": "application/json" })
        responseHeaders.set("X-Toni-Cache", "HIT")
        if (rl) {
          responseHeaders.set("X-RateLimit-Remaining", String(rl.remaining))
          responseHeaders.set("X-RateLimit-Reset", String(rl.resetInSec))
        }

        return new Response(
          JSON.stringify({ ok: true, thread_id: body.thread_id, reply: cached.answer, cached: true }),
          { status: 200, headers: responseHeaders }
        )
      }
    }

    const workerBaseUrl = getWorkerBaseUrl()
    if (!workerBaseUrl) {
      return new Response(JSON.stringify({ error: "Falta configurar NEXT_PUBLIC_WORKER_URL." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const upstream = await fetch(`${workerBaseUrl}/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ message, thread_id: body.thread_id }),
      cache: "no-store",
    })

    const rawText = await upstream.text()
    const responseHeaders = new Headers({ "Content-Type": "application/json" })
    responseHeaders.set("X-Toni-Cache", "MISS")

    if (rl) {
      responseHeaders.set("X-RateLimit-Remaining", String(rl.remaining))
      responseHeaders.set("X-RateLimit-Reset", String(rl.resetInSec))
    }

    if (!upstream.ok) {
      try {
        const parsed = rawText ? JSON.parse(rawText) : null
        const message = parsed?.error?.message ?? parsed?.error ?? DEFAULT_ERROR_MESSAGE

        return new Response(
          JSON.stringify({ error: message }),
          { status: upstream.status, headers: responseHeaders }
        )
      } catch {
        return new Response(
          JSON.stringify({ error: DEFAULT_ERROR_MESSAGE }),
          { status: upstream.status, headers: responseHeaders }
        )
      }
    }

    if (shouldCache && ctx?.env?.AG_TONI_CACHE) {
      try {
        const parsed = rawText ? JSON.parse(rawText) : null
        const answer = parsed?.reply
        if (typeof answer === "string" && answer.trim()) {
          await kvSetJson(ctx.env.AG_TONI_CACHE, cacheKey, { answer }, 120)
        }
      } catch {
        // noop: if upstream payload isn't JSON, skip cache write.
      }
    }

    return new Response(rawText || JSON.stringify({ ok: false, error: { message: DEFAULT_ERROR_MESSAGE } }), {
      status: 200,
      headers: responseHeaders,
    })
  } catch (e: any) {
    if (e?.message === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes. Intenta en unos segundos." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(e.retryAfter) } }
      )
    }

    throw e
  }
}
