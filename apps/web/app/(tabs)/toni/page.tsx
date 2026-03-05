"use client"

import { FormEvent, useEffect, useRef, useState } from "react"

import { getThreadMessages, getThreads, sendChatMessage } from "@/lib/api"

type UiMessage = {
  role: "user" | "assistant"
  content: string
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
        const threads = await getThreads()
        if (threads.length === 0) {
          return
        }

        const firstThreadId = threads[0].id
        setThreadId(firstThreadId)

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

  return (
    <div
      className="space-y-4"
      style={{ paddingBottom: "calc(10rem + env(safe-area-inset-bottom))" }}
    >
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold">Toni</h1>
        <p className="text-sm text-gray-600">Tu asistente para cuidar mejor tus plantas.</p>
      </section>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      <section className="space-y-3">
        {messages.length === 0 ? (
          <div className="bg-white border rounded-2xl shadow-sm p-4 space-y-1">
            <p className="font-medium">Pregúntale algo a Toni</p>
            <p className="text-sm text-gray-600">
              Pide ayuda con riego, luz o cuidados de tus plantas.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm border ${
                  message.role === "user"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-900 border-gray-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}

        {isSending ? (
          <div className="flex justify-start" aria-live="polite">
            <div className="max-w-[85%] rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm">
              Toni está escribiendo...
            </div>
          </div>
        ) : null}

        {sendError ? (
          <div className="flex justify-start" role="alert" aria-live="polite">
            <div className="max-w-[85%] space-y-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
              <p>{sendError}</p>
              <button
                type="button"
                onClick={() => {
                  void handleRetry()
                }}
                disabled={isSending || !lastUserMessage}
                className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-60"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} aria-hidden="true" />
      </section>

      <form
        onSubmit={handleSubmit}
        className="fixed left-0 right-0 border-t bg-white px-4 py-3"
        style={{
          bottom: "calc(3.75rem + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)"
        }}
      >
        <div className="mx-auto flex max-w-md gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe tu mensaje..."
            className="w-full rounded-xl border px-3 py-2 text-sm"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  )
}
