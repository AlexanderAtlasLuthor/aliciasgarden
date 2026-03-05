"use client"

import { FormEvent, useEffect, useState } from "react"

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
  const [error, setError] = useState<string | null>(null)

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
      } catch {
        setError("Ups, no pudimos cargar tus mensajes. Intenta de nuevo.")
      }
    }

    void loadInitialThread()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = input.trim()
    if (!trimmedMessage || isSending) {
      return
    }

    setError(null)
    setIsSending(true)
    setInput("")
    setMessages((current) => [...current, { role: "user", content: trimmedMessage }])

    try {
      const result = await sendChatMessage({
        message: trimmedMessage,
        thread_id: threadId ?? undefined
      })

      setThreadId(result.thread_id)
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.reply }
      ])
    } catch {
      setError("Toni esta ocupado, intenta en un momento.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold">Toni</h1>
        <p className="text-sm text-gray-600">Tu asistente para cuidar mejor tus plantas.</p>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        {messages.length === 0 ? (
          <div className="bg-white border rounded-2xl shadow-sm p-4 space-y-1">
            <p className="font-medium">Preguntale algo a Toni</p>
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
      </section>

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-16 left-0 right-0 border-t bg-white px-4 py-3"
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
