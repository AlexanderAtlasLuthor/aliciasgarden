import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import HomePage from "@/app/(tabs)/home/page"
import type { Plant } from "@/lib/api"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  getPlants: vi.fn()
}))

const mockedGetPlants = vi.mocked(api.getPlants)

const makePlant = (id: string, nickname: string): Plant => ({
  id,
  profile_id: "profile-1",
  nickname,
  species_common: "Monstera",
  location: "Sala",
  light: null,
  watering_interval_days: 7,
  notes: null,
  created_at: new Date().toISOString()
})

describe("home page", () => {
  beforeEach(() => {
    mockedGetPlants.mockReset()
  })

  it("shows core CTAs and empty state", async () => {
    mockedGetPlants.mockResolvedValue([])

    render(<HomePage />)

    expect(screen.getByText("Hablar con Toni")).toBeInTheDocument()
    expect(screen.getByText("Añadir planta")).toBeInTheDocument()
    expect(await screen.findByText("Aún no tienes plantas 🌿")).toBeInTheDocument()
  })

  it("shows preview with up to 3 plants", async () => {
    mockedGetPlants.mockResolvedValue([
      makePlant("1", "Poto"),
      makePlant("2", "Aloe"),
      makePlant("3", "Ficus"),
      makePlant("4", "Helecho")
    ])

    render(<HomePage />)

    expect(await screen.findByText("Poto")).toBeInTheDocument()
    expect(screen.getByText("Aloe")).toBeInTheDocument()
    expect(screen.getByText("Ficus")).toBeInTheDocument()
    expect(screen.queryByText("Helecho")).not.toBeInTheDocument()
    expect(screen.getByText("Ver mi jardín")).toBeInTheDocument()
  })

  it("shows error and retries loading", async () => {
    const user = userEvent.setup()
    mockedGetPlants
      .mockRejectedValueOnce(new Error("Fallo temporal"))
      .mockResolvedValueOnce([])

    render(<HomePage />)

    expect(await screen.findByText("Fallo temporal")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reintentar" }))

    expect(await screen.findByText("Aún no tienes plantas 🌿")).toBeInTheDocument()
    expect(mockedGetPlants).toHaveBeenCalledTimes(2)
  })
})
