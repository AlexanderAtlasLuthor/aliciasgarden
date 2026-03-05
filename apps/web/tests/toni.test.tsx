import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import ToniPage from "@/app/(tabs)/toni/page"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  getThreads: vi.fn(),
  getThreadMessages: vi.fn(),
  sendChatMessage: vi.fn()
}))

const mockedGetThreads = vi.mocked(api.getThreads)
const mockedGetThreadMessages = vi.mocked(api.getThreadMessages)
const mockedSendChatMessage = vi.mocked(api.sendChatMessage)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe("toni chat", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true)

    mockedGetThreads.mockReset()
    mockedGetThreadMessages.mockReset()
    mockedSendChatMessage.mockReset()

    mockedGetThreads.mockResolvedValue([])
    mockedGetThreadMessages.mockResolvedValue([])
  })

  it("sends a message, calls API, and shows typing state while pending", async () => {
    const user = userEvent.setup()
    const pending = deferred<{ thread_id: string; reply: string }>()
    mockedSendChatMessage.mockReturnValueOnce(pending.promise)

    render(<ToniPage />)

    const input = screen.getByPlaceholderText("Escribe tu mensaje...")
    await user.type(input, "Hola Toni")
    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(mockedSendChatMessage).toHaveBeenCalledWith({
      message: "Hola Toni",
      thread_id: undefined
    })
    expect(screen.getByText("Toni está escribiendo...")).toBeInTheDocument()
    expect(input).toBeDisabled()

    pending.resolve({ thread_id: "thread-1", reply: "Hola Alicia" })

    expect(await screen.findByText("Hola Alicia")).toBeInTheDocument()
  })

  it("shows inline error and retries last failed send", async () => {
    const user = userEvent.setup()
    mockedSendChatMessage
      .mockRejectedValueOnce(new Error("No se pudo enviar"))
      .mockResolvedValueOnce({ thread_id: "thread-1", reply: "Ya funciono" })

    render(<ToniPage />)

    const input = screen.getByPlaceholderText("Escribe tu mensaje...")
    await user.type(input, "Necesito ayuda")
    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(await screen.findByText("No se pudo enviar")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reintentar" }))

    await waitFor(() => {
      expect(mockedSendChatMessage).toHaveBeenCalledTimes(2)
    })
    expect(mockedSendChatMessage).toHaveBeenNthCalledWith(2, {
      message: "Necesito ayuda",
      thread_id: undefined
    })
    expect(await screen.findByText("Ya funciono")).toBeInTheDocument()
    expect(screen.getAllByText("Necesito ayuda")).toHaveLength(1)
  })

  it("normalizes markdown-like assistant output and clears chat on demand", async () => {
    const user = userEvent.setup()
    mockedSendChatMessage.mockResolvedValueOnce({
      thread_id: "thread-1",
      reply: "**Riega hoy**\n* mañana revisa\n`humedad`"
    })

    render(<ToniPage />)

    const input = screen.getByPlaceholderText("Escribe tu mensaje...")
    await user.type(input, "Tengo dudas")
    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(await screen.findByText(/Riega hoy/i)).toBeInTheDocument()
    expect(screen.getByText(/- mañana revisa/i)).toBeInTheDocument()
    expect(screen.getByText(/humedad/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Limpiar chat" }))

    expect(screen.getByText("Pregúntale algo a Toni")).toBeInTheDocument()
  })
})
