"use client"

import { FormEvent, useEffect, useRef, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import GlassSurface from "@/components/ui/GlassSurface"
import Input from "@/components/ui/Input"
import { getThreadMessages, getThreads, sendChatMessage } from "@/lib/api"

type UiMessage = {
  role: "user" | "assistant"
  content: string
}

const THREAD_STORAGE_KEY = "ag_thread_id"
const CLEARED_STORAGE_KEY = "ag_chat_cleared"

function normalizeAssistantText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*\*\s+/gm, "- ")
}

export default function ToniPage() {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loadInitialThread = async () => {
      try {
        const storedThreadId = localStorage.getItem(THREAD_STORAGE_KEY)
        const wasCleared = localStorage.getItem(CLEARED_STORAGE_KEY) === "1"

        if (storedThreadId?.trim()) {
          setThreadId(storedThreadId)

          const threadMessages = await getThreadMessages(storedThreadId)
          const uiMessages: UiMessage[] = []

          for (const message of threadMessages) {
            if (message.role === "user" || message.role === "assistant") {
              uiMessages.push({
                role: message.role,
                content: message.content
              })
            }
          }

          setMessages(uiMessages)
          return
        }

        if (wasCleared) {
          return
        }

        const threads = await getThreads()
        if (threads.length === 0) {
          return
        }

        const firstThreadId = threads[0].id
        setThreadId(firstThreadId)
        localStorage.setItem(THREAD_STORAGE_KEY, firstThreadId)

        const threadMessages = await getThreadMessages(firstThreadId)
        const uiMessages: UiMessage[] = []

        for (const message of threadMessages) {
          if (message.role === "user" || message.role === "assistant") {
            uiMessages.push({
              role: message.role,
              content: message.content
            })
          }
        }

        setMessages(uiMessages)
      } catch (error: unknown) {
        const fallbackMessage = "Ups, no pudimos cargar tus mensajes. Intenta de nuevo."

        if (error && typeof error === "object" && "message" in error) {
          const message = (error as { message?: unknown }).message
          if (typeof message === "string" && message.trim()) {
            setLoadError(message)
            return
          }
        }

        setLoadError(fallbackMessage)
      }
    }

    void loadInitialThread()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isSending, threadId, sendError])

  const sendMessage = async (message: string, appendUserMessage: boolean) => {
    if (isSending) {
      return
    }

    setIsSending(true)
    setSendError(null)
    setLastUserMessage(message)

    if (appendUserMessage) {
      setMessages((current) => [...current, { role: "user", content: message }])
    }

    try {
      const result = await sendChatMessage({
        message,
        thread_id: threadId ?? undefined
      })

      setThreadId(result.thread_id)
      localStorage.setItem(THREAD_STORAGE_KEY, result.thread_id)
      localStorage.removeItem(CLEARED_STORAGE_KEY)
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.reply }
      ])
      setLastUserMessage(null)
    } catch (error: unknown) {
      const fallbackMessage = "Toni esta ocupado, intenta en un momento."

      if (error && typeof error === "object" && "message" in error) {
        const messageText = (error as { message?: unknown }).message
        if (typeof messageText === "string" && messageText.trim()) {
          setSendError(messageText)
          return
        }
      }

      setSendError(fallbackMessage)
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = input.trim()
    if (!trimmedMessage || isSending) {
      return
    }

    setLoadError(null)
    setInput("")
    await sendMessage(trimmedMessage, true)
  }

  const handleRetry = async () => {
    if (!lastUserMessage) {
      return
    }

    await sendMessage(lastUserMessage, false)
  }

  const handleClearChat = () => {
    if (!window.confirm("¿Borrar conversación?")) {
      return
    }

    setMessages([])
    setThreadId(null)
    setLoadError(null)
    setSendError(null)
    setLastUserMessage(null)
    localStorage.removeItem(THREAD_STORAGE_KEY)
    localStorage.setItem(CLEARED_STORAGE_KEY, "1")
  }

  return (
    <div className="ag-container ag-screen">
      <div
        className="ag-panel space-y-4"
        style={{ paddingBottom: "calc(9.5rem + env(safe-area-inset-bottom))" }}
      >
        <section className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-primary text-2xl font-semibold tracking-tight">Toni</h1>
            <button
              type="button"
              onClick={handleClearChat}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80 transition hover:bg-white/10"
            >
              Limpiar chat
            </button>
          </div>
          <p className="text-secondary text-sm">Tu asistente para cuidar mejor tus plantas.</p>
        </section>

        {loadError ? (
          <Card className="border-red-400/35 bg-red-500/10" role="alert">
            <CardContent>
              <p className="text-sm text-white/80">{loadError}</p>
            </CardContent>
          </Card>
        ) : null}

        <section className="max-h-[46dvh] space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <GlassSurface
              className="p-4"
              variant="medium"
              style={{ boxShadow: "none", filter: "none" }}
            >
              <div className="space-y-1">
                <p className="text-primary font-medium">Pregúntale algo a Toni</p>
                <p className="text-secondary text-sm">
                  Pide ayuda con riego, luz o cuidados de tus plantas.
                </p>
              </div>
            </GlassSurface>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" ? (
                  <div className="max-w-[85%] rounded-[30px] border border-white/20 bg-[#355f54] px-[14px] py-[12px] md:max-w-[65%]">
                    <p className="text-primary text-sm">{normalizeAssistantText(message.content)}</p>
                  </div>
                ) : (
                  <div className="text-primary max-w-[85%] rounded-full border border-white/[0.12] bg-white/10 px-[14px] py-[10px] text-sm md:max-w-[65%]">
                    {message.content}
                  </div>
                )}
              </div>
            ))
          )}

          {isSending ? (
            <div className="flex justify-start" aria-live="polite">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-[#2e5548] px-3 py-1 text-xs text-secondary">
                <span className="h-2 w-2 rounded-full bg-white/65" />
                <span className="opacity-80">Toni está escribiendo...</span>
                <span className="relative h-2 w-10 overflow-hidden rounded-full bg-white/10">
                  <span className="absolute inset-0 animate-pulse bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" />
                </span>
              </div>
            </div>
          ) : null}

          {sendError ? (
            <div className="flex justify-start" role="alert" aria-live="polite">
              <Card className="text-primary max-w-[85%] border border-[rgba(255,80,80,0.18)] bg-[rgba(255,80,80,0.08)] text-sm">
                <CardContent className="space-y-2">
                  <p>{sendError}</p>
                  <Button
                    type="button"
                    onClick={() => {
                      void handleRetry()
                    }}
                    disabled={isSending || !lastUserMessage}
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full border-white/15 bg-white/8 px-3 text-xs font-medium text-white/90 hover:bg-white/12"
                  >
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div ref={messagesEndRef} aria-hidden="true" />
        </section>
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed left-0 right-0 py-3"
        style={{
          bottom: "calc(5rem + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)"
        }}
      >
        <div className="ag-container">
          <div className="relative overflow-hidden rounded-2xl border border-white/16 bg-[#1b4034] p-2">
            <div className="relative flex items-center gap-2">
              <Input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Escribe tu mensaje..."
                disabled={isSending}
                className="h-11 w-full rounded-xl border border-transparent bg-transparent px-4 py-3 text-sm text-primary outline-none ring-0 placeholder:text-hairline focus:border-white/10 focus:ring-2 focus:ring-[rgba(46,240,155,0.25)]"
              />
              <Button
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label={isSending ? "Enviando..." : "Enviar"}
                className="h-10 w-10 rounded-full border-0 bg-[linear-gradient(135deg,rgba(46,240,155,0.95),rgba(0,180,140,0.85))] p-0 text-lg font-semibold text-black transition hover:brightness-110 disabled:shadow-none"
              >
                {isSending ? "…" : "→"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
