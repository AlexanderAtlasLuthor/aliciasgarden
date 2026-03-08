import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PlantDetailPage from "@/app/(tabs)/garden/[plantId]/page"
import type { Plant } from "@/lib/api"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  createPlantMeasurement: vi.fn(),
  createPlantEvent: vi.fn(),
  deletePlant: vi.fn(),
  deletePlantEvent: vi.fn(),
  getPlantById: vi.fn(),
  getPlantEvents: vi.fn(),
  getPlantMeasurements: vi.fn(),
  isAPIError: vi.fn(() => false),
  patchPlant: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({
    plantId: "plant-growth-44",
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

const mockedGetPlantById = vi.mocked(api.getPlantById)
const mockedGetPlantEvents = vi.mocked(api.getPlantEvents)
const mockedGetPlantMeasurements = vi.mocked(api.getPlantMeasurements)
const mockedCreatePlantMeasurement = vi.mocked(api.createPlantMeasurement)
const mockedIsAPIError = vi.mocked(api.isAPIError)

const makePlant = (): Plant => ({
  id: "plant-growth-44",
  profile_id: "profile-1",
  nickname: "Monstera Growth",
  species_common: "Monstera deliciosa",
  location: "Sala",
  light: "Indirecta",
  watering_interval_days: 7,
  notes: null,
  cover_photo_url: null,
  created_at: "2026-03-05T00:00:00.000Z",
})

describe("garden/[plantId] growth measurement form", () => {
  beforeEach(() => {
    mockedGetPlantById.mockReset()
    mockedGetPlantEvents.mockReset()
    mockedGetPlantMeasurements.mockReset()
    mockedCreatePlantMeasurement.mockReset()
    mockedIsAPIError.mockReset()

    mockedGetPlantById.mockResolvedValue(makePlant())
    mockedGetPlantEvents.mockResolvedValue([])
    mockedGetPlantMeasurements.mockResolvedValue({ measurements: [] })
    mockedIsAPIError.mockImplementation((error: unknown) => {
      if (!error || typeof error !== "object") return false
      const maybe = error as { code?: unknown; message?: unknown }
      return typeof maybe.code === "string" && typeof maybe.message === "string"
    })
  })

  it("renders Crecimiento section with expected fields and save button", async () => {
    render(<PlantDetailPage />)

    const sectionTitle = await screen.findByText("Crecimiento")
    const section = sectionTitle.closest("div")
    if (!section) {
      throw new Error("Crecimiento section not found")
    }

    expect(within(section).getByLabelText("Altura (cm)")).toBeInTheDocument()
    expect(within(section).getByLabelText("Hojas")).toBeInTheDocument()
    expect(within(section).getByLabelText("Nota")).toBeInTheDocument()
    expect(within(section).getByRole("button", { name: /Guardar medici[oó]n/i })).toBeInTheDocument()
  })

  it("shows error and does not call API on empty form", async () => {
    const user = userEvent.setup()
    render(<PlantDetailPage />)

    const button = await screen.findByRole("button", { name: /Guardar medici[oó]n/i })
    await user.click(button)

    expect(await screen.findByText("Ingresa al menos altura, hojas o una nota.")).toBeInTheDocument()
    expect(mockedCreatePlantMeasurement).not.toHaveBeenCalled()
  })

  it("saves with only altura and sends only that field", async () => {
    const user = userEvent.setup()
    mockedCreatePlantMeasurement.mockResolvedValueOnce({
      measurement: {
        id: "m-1",
        profile_id: "profile-1",
        plant_id: "plant-growth-44",
        height_cm: 42,
        leaf_count: null,
        notes: null,
        measured_at: "2026-03-08T12:00:00.000Z",
        created_at: "2026-03-08T12:00:00.000Z",
      },
    })

    render(<PlantDetailPage />)

    await user.type(await screen.findByLabelText("Altura (cm)"), "42")
    await user.click(screen.getByRole("button", { name: /Guardar medici[oó]n/i }))

    await waitFor(() => {
      expect(mockedCreatePlantMeasurement).toHaveBeenCalledWith("plant-growth-44", {
        height_cm: 42,
      })
    })
  })

  it("saves with only hojas and sends only that field", async () => {
    const user = userEvent.setup()
    mockedCreatePlantMeasurement.mockResolvedValueOnce({
      measurement: {
        id: "m-2",
        profile_id: "profile-1",
        plant_id: "plant-growth-44",
        height_cm: null,
        leaf_count: 7,
        notes: null,
        measured_at: "2026-03-08T12:00:00.000Z",
        created_at: "2026-03-08T12:00:00.000Z",
      },
    })

    render(<PlantDetailPage />)

    await user.type(await screen.findByLabelText("Hojas"), "7")
    await user.click(screen.getByRole("button", { name: /Guardar medici[oó]n/i }))

    await waitFor(() => {
      expect(mockedCreatePlantMeasurement).toHaveBeenCalledWith("plant-growth-44", {
        leaf_count: 7,
      })
    })
  })

  it("saves with only nota and sends only trimmed note", async () => {
    const user = userEvent.setup()
    mockedCreatePlantMeasurement.mockResolvedValueOnce({
      measurement: {
        id: "m-3",
        profile_id: "profile-1",
        plant_id: "plant-growth-44",
        height_cm: null,
        leaf_count: null,
        notes: "Nueva hoja",
        measured_at: "2026-03-08T12:00:00.000Z",
        created_at: "2026-03-08T12:00:00.000Z",
      },
    })

    render(<PlantDetailPage />)

    await user.type(await screen.findByLabelText("Nota"), "  Nueva hoja  ")
    await user.click(screen.getByRole("button", { name: /Guardar medici[oó]n/i }))

    await waitFor(() => {
      expect(mockedCreatePlantMeasurement).toHaveBeenCalledWith("plant-growth-44", {
        notes: "Nueva hoja",
      })
    })
  })

  it("shows saving state, success feedback, and clears form on success", async () => {
    const user = userEvent.setup()

    type CreateMeasurementResult = Awaited<ReturnType<typeof api.createPlantMeasurement>>
    let resolveCall: ((value: CreateMeasurementResult) => void) | undefined
    const pending = new Promise<CreateMeasurementResult>((resolve) => {
      resolveCall = resolve
    })

    mockedCreatePlantMeasurement.mockReturnValueOnce(pending)

    render(<PlantDetailPage />)

    const heightInput = await screen.findByLabelText("Altura (cm)")
    const leavesInput = screen.getByLabelText("Hojas")
    const noteInput = screen.getByLabelText("Nota")

    await user.type(heightInput, "42")
    await user.type(leavesInput, "7")
    await user.type(noteInput, "Nueva hoja")

    await user.click(screen.getByRole("button", { name: /Guardar medici[oó]n/i }))

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled()
    expect(heightInput).toBeDisabled()
    expect(leavesInput).toBeDisabled()
    expect(noteInput).toBeDisabled()

    if (resolveCall) {
      resolveCall({
        measurement: {
          id: "m-4",
          profile_id: "profile-1",
          plant_id: "plant-growth-44",
          height_cm: 42,
          leaf_count: 7,
          notes: "Nueva hoja",
          measured_at: "2026-03-08T12:00:00.000Z",
          created_at: "2026-03-08T12:00:00.000Z",
        },
      })
    }

    await waitFor(() => {
      expect(screen.getByText("Medicion guardada.")).toBeInTheDocument()
    })

    expect((screen.getByLabelText("Altura (cm)") as HTMLInputElement).value).toBe("")
    expect((screen.getByLabelText("Hojas") as HTMLInputElement).value).toBe("")
    expect((screen.getByLabelText("Nota") as HTMLTextAreaElement).value).toBe("")
  })

  it("shows visible error when save fails", async () => {
    const user = userEvent.setup()
    mockedCreatePlantMeasurement.mockRejectedValueOnce({
      code: "DB_ERROR",
      message: "No se pudo guardar la medicion.",
    })

    render(<PlantDetailPage />)

    await user.type(await screen.findByLabelText("Altura (cm)"), "42")
    await user.click(screen.getByRole("button", { name: /Guardar medici[oó]n/i }))

    expect(await screen.findByText("No se pudo guardar la medicion.")).toBeInTheDocument()
  })
})
