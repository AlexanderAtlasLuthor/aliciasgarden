import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import NewPlantPage from "@/app/(tabs)/garden/new/page"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  createPlant: vi.fn()
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}))

const mockedCreatePlant = vi.mocked(api.createPlant)

describe("garden/new form validation", () => {
  beforeEach(() => {
    mockedCreatePlant.mockReset()
    mockedCreatePlant.mockResolvedValue({
      id: "plant-1",
      profile_id: "profile-1",
      nickname: "Aloe",
      species_common: null,
      location: null,
      light: null,
      watering_interval_days: null,
      notes: null,
      created_at: new Date().toISOString()
    })
  })

  it("validates nickname required and range", async () => {
    const user = userEvent.setup()
    render(<NewPlantPage />)
    const submitButton = screen.getByRole("button", { name: "Guardar planta" })
    const form = submitButton.closest("form")
    if (!form) {
      throw new Error("Form element not found")
    }

    fireEvent.submit(form)
    expect(await screen.findByText("El nombre (nickname) es obligatorio.")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Nombre (nickname)"), "A")
    fireEvent.submit(form)

    expect(
      await screen.findByText("El nombre debe tener entre 2 y 40 caracteres.")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Nombre (nickname)")).toHaveAttribute("aria-invalid", "true")
  })

  it("validates watering interval integer and range", async () => {
    const user = userEvent.setup()
    render(<NewPlantPage />)
    const submitButton = screen.getByRole("button", { name: "Guardar planta" })
    const form = submitButton.closest("form")
    if (!form) {
      throw new Error("Form element not found")
    }

    await user.type(screen.getByLabelText("Nombre (nickname)"), "Aloe")
    const wateringInput = screen.getByLabelText("Intervalo de riego (días)")

    fireEvent.change(wateringInput, { target: { value: "1.5" } })
    fireEvent.submit(form)
    expect(
      await screen.findByText("El intervalo de riego debe ser un numero entero.")
    ).toBeInTheDocument()

    fireEvent.change(wateringInput, { target: { value: "500" } })
    fireEvent.submit(form)

    expect(
      await screen.findByText("El intervalo de riego debe estar entre 1 y 365 dias.")
    ).toBeInTheDocument()
  })
})
