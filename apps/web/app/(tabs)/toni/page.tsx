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
        <Card className="border-ag-danger bg-red-50" role="alert">
          <CardContent>
            <p className="text-sm text-red-700">{loadError}</p>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        {messages.length === 0 ? (
          <GlassSurface className="p-4" variant="strong">
            <div className="space-y-1">
              <p className="font-medium">Pregúntale algo a Toni</p>
              <p className="text-sm text-white/70">
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
                <GlassSurface className="max-w-[80%] p-[14px]" variant="strong">
                  <p className="text-sm text-white">{message.content}</p>
                </GlassSurface>
              ) : (
                <div className="max-w-[80%] rounded-full border border-green-300/20 bg-green-500/20 px-[14px] py-[10px] text-sm text-white">
                  {message.content}
                </div>
              )}
            </div>
          ))
        )}

        {isSending ? (
          <div className="flex justify-start" aria-live="polite">
            <GlassSurface className="max-w-[80%] p-[14px]" variant="strong">
              <p className="text-sm text-white/70">Toni está escribiendo...</p>
            </GlassSurface>
          </div>
        ) : null}

        {sendError ? (
          <div className="flex justify-start" role="alert" aria-live="polite">
            <Card className="max-w-[85%] border-ag-danger bg-red-50 text-sm text-red-700">
              <CardContent className="space-y-2">
                <p>{sendError}</p>
                <Button
                  type="button"
                  onClick={() => {
                    void handleRetry()
                  }}
                  disabled={isSending || !lastUserMessage}
                  variant="danger"
                  size="sm"
                >
                  Reintentar
                </Button>
              </CardContent>
            </Card>
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
          <Input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={isSending || !input.trim()}
          >
            {isSending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
