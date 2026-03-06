import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import GardenPage from "@/app/(tabs)/garden/page"
import NewPlantPage from "@/app/(tabs)/garden/new/page"
import HomePage from "@/app/(tabs)/home/page"
import ToniPage from "@/app/(tabs)/toni/page"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  getPlants: vi.fn(),
  createPlant: vi.fn(),
  getThreads: vi.fn(),
  getThreadMessages: vi.fn(),
  sendChatMessage: vi.fn()
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}))

const mockedGetPlants = vi.mocked(api.getPlants)
const mockedGetThreads = vi.mocked(api.getThreads)
const mockedGetThreadMessages = vi.mocked(api.getThreadMessages)

describe("route smoke render", () => {
  beforeEach(() => {
    mockedGetPlants.mockResolvedValue([])
    mockedGetThreads.mockResolvedValue([])
    mockedGetThreadMessages.mockResolvedValue([])
  })

  it("renders /home", async () => {
    render(<HomePage />)
    expect(screen.getByText("Hablar con Toni")).toBeInTheDocument()
    expect(await screen.findByText("Favoritas del jardín")).toBeInTheDocument()
  })

  it("renders /garden", async () => {
    const view = await GardenPage()
    render(view)
    expect(
      screen.getByRole("heading", { level: 1, name: "Mi Jardín" })
    ).toBeInTheDocument()
  })

  it("renders /garden/new", () => {
    render(<NewPlantPage />)
    expect(screen.getByRole("heading", { name: "Añadir planta" })).toBeInTheDocument()
  })

  it("renders /toni", () => {
    render(<ToniPage />)
    expect(screen.getByRole("heading", { name: "Toni" })).toBeInTheDocument()
  })
})
