import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PlantDetailPage from "@/app/(tabs)/garden/[plantId]/page"
import type { Plant, PlantMeasurement } from "@/lib/api"
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
    plantId: "plant-growth-45",
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
  id: "plant-growth-45",
  profile_id: "profile-1",
  nickname: "Monstera Historial",
  species_common: "Monstera deliciosa",
  location: "Sala",
  light: "Indirecta",
  watering_interval_days: 7,
  notes: null,
  cover_photo_url: null,
  created_at: "2026-03-08T00:00:00.000Z",
})

function makeMeasurement(input: {
  id: string
  measured_at: string
  height_cm?: number | null
  leaf_count?: number | null
  notes?: string | null
}): PlantMeasurement {
  return {
    id: input.id,
    profile_id: "profile-1",
    plant_id: "plant-growth-45",
    measured_at: input.measured_at,
    created_at: input.measured_at,
    height_cm: input.height_cm ?? null,
    leaf_count: input.leaf_count ?? null,
    notes: input.notes ?? null,
  }
}

describe("garden/[plantId] growth history and chart", () => {
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

  it("shows loading state while the page fetches measurements", async () => {
    let resolveMeasurements:
      | ((value: { measurements: PlantMeasurement[] }) => void)
      | undefined

    mockedGetPlantMeasurements.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveMeasurements = resolve
      })
    )

    const { container } = render(<PlantDetailPage />)

    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()

    if (resolveMeasurements) {
      resolveMeasurements({ measurements: [] })
    }

    await screen.findByText("Crecimiento")
  })

  it("shows empty state when there are no measurements", async () => {
    render(<PlantDetailPage />)

    await screen.findByText("Historico reciente")
    expect(
      screen.getByText("Aun no hay mediciones guardadas para esta planta.")
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Aun no hay suficientes alturas para graficar. Registra al menos dos mediciones con altura."
      )
    ).toBeInTheDocument()
  })

  it("shows error state for measurements without breaking the plant detail page", async () => {
    mockedGetPlantMeasurements.mockRejectedValueOnce({
      code: "DB_ERROR",
      message: "No se pudieron cargar mediciones.",
    })

    render(<PlantDetailPage />)

    await screen.findByText("Crecimiento")
    expect(screen.getAllByText("No se pudieron cargar mediciones.").length).toBeGreaterThan(0)
    expect(screen.getByText("Monstera Historial")).toBeInTheDocument()
  })

  it("shows measurement history using latest 10 items with useful fields", async () => {
    const measurements = Array.from({ length: 12 }).map((_, index) => {
      const day = String(index + 1).padStart(2, "0")
      return makeMeasurement({
        id: `m-${index + 1}`,
        measured_at: `2026-03-${day}T12:00:00.000Z`,
        height_cm: 20 + index,
        leaf_count: 5 + index,
        notes: `Nota ${index + 1}`,
      })
    })

    mockedGetPlantMeasurements.mockResolvedValueOnce({ measurements })

    render(<PlantDetailPage />)

    const historyTitle = await screen.findByText("Historico reciente")
    const historyBlock = historyTitle.closest("div")?.parentElement
    if (!historyBlock) {
      throw new Error("History block not found")
    }

    const historyItems = historyBlock.querySelectorAll("ul > li")
    expect(historyItems.length).toBe(10)

    expect(screen.getByText(/Altura: 31 cm/)).toBeInTheDocument()
    expect(screen.getByText(/Hojas: 16/)).toBeInTheDocument()
    expect(screen.getByText("Nota 12")).toBeInTheDocument()
    expect(screen.queryByText("Nota 1")).not.toBeInTheDocument()
  })

  it("shows simple chart when there are at least 2 height measurements", async () => {
    mockedGetPlantMeasurements.mockResolvedValueOnce({
      measurements: [
        makeMeasurement({
          id: "m-1",
          measured_at: "2026-03-01T12:00:00.000Z",
          height_cm: 20,
        }),
        makeMeasurement({
          id: "m-2",
          measured_at: "2026-03-05T12:00:00.000Z",
          height_cm: 24,
        }),
      ],
    })

    render(<PlantDetailPage />)

    expect(
      await screen.findByLabelText("Grafica simple de crecimiento por altura")
    ).toBeInTheDocument()
  })

  it("shows chart fallback when there are not enough valid height points", async () => {
    mockedGetPlantMeasurements.mockResolvedValueOnce({
      measurements: [
        makeMeasurement({
          id: "m-1",
          measured_at: "2026-03-01T12:00:00.000Z",
          height_cm: null,
          leaf_count: 7,
        }),
      ],
    })

    render(<PlantDetailPage />)

    await screen.findByText("Historico reciente")
    expect(
      screen.getByText(
        "Aun no hay suficientes alturas para graficar. Registra al menos dos mediciones con altura."
      )
    ).toBeInTheDocument()
  })

  it("refreshes history and chart consistency after saving a new measurement", async () => {
    const user = userEvent.setup()

    mockedGetPlantMeasurements.mockResolvedValueOnce({
      measurements: [
        makeMeasurement({
          id: "m-1",
          measured_at: "2026-03-01T12:00:00.000Z",
          height_cm: 20,
          leaf_count: 5,
          notes: "Base",
        }),
      ],
    })

    mockedCreatePlantMeasurement.mockResolvedValueOnce({
      measurement: makeMeasurement({
        id: "m-2",
        measured_at: "2026-03-10T12:00:00.000Z",
        height_cm: 24,
        leaf_count: 8,
        notes: "Nueva medicion",
      }),
    })

    render(<PlantDetailPage />)

    await screen.findByText("Historico reciente")
    expect(
      screen.getByText(
        "Aun no hay suficientes alturas para graficar. Registra al menos dos mediciones con altura."
      )
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("Altura (cm)"), "24")
    await user.type(screen.getByLabelText("Hojas"), "8")
    await user.type(screen.getByLabelText("Nota"), "Nueva medicion")
    await user.click(screen.getByRole("button", { name: /Guardar medici[oó]n/i }))

    await waitFor(() => {
      expect(screen.getByText("Nueva medicion")).toBeInTheDocument()
    })

    expect(screen.getByLabelText("Grafica simple de crecimiento por altura")).toBeInTheDocument()
  })
})
