import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PlantDiagnosePage from "@/app/(tabs)/garden/[plantId]/diagnose/page"
import type { DiagnosePlantPhotoResponse, Plant, PlantPhoto } from "@/lib/api"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  diagnosePlantPhoto: vi.fn(),
  getPlantById: vi.fn(),
  getPlantPhotos: vi.fn(),
  isAPIError: vi.fn((error: unknown) => {
    if (!error || typeof error !== "object") return false
    const maybe = error as { code?: unknown; message?: unknown }
    return typeof maybe.code === "string" && typeof maybe.message === "string"
  }),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({
    plantId: "plant-qa-26",
  }),
}))

const mockedGetPlantById = vi.mocked(api.getPlantById)
const mockedGetPlantPhotos = vi.mocked(api.getPlantPhotos)
const mockedDiagnosePlantPhoto = vi.mocked(api.diagnosePlantPhoto)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

const makePlant = (): Plant => ({
  id: "plant-qa-26",
  profile_id: "profile-1",
  nickname: "Monstera QA",
  species_common: "Monstera deliciosa",
  location: "Sala",
  light: "Indirecta",
  watering_interval_days: 7,
  notes: null,
  cover_photo_url: null,
  created_at: "2026-03-05T00:00:00.000Z",
})

const makePhoto = (id: string, caption: string, url: string): PlantPhoto => ({
  id,
  profile_id: "profile-1",
  plant_id: "plant-qa-26",
  storage_path: `profile/profile-1/plants/plant-qa-26/${id}.jpg`,
  caption,
  taken_at: null,
  created_at: "2026-03-05T00:00:00.000Z",
  url,
})

describe("garden/[plantId]/diagnose page", () => {
  beforeEach(() => {
    mockedGetPlantById.mockReset()
    mockedGetPlantPhotos.mockReset()
    mockedDiagnosePlantPhoto.mockReset()
  })

  it("shows loading state while photos are loading", async () => {
    const plantDeferred = deferred<Plant>()
    const photosDeferred = deferred<PlantPhoto[]>()

    mockedGetPlantById.mockReturnValueOnce(plantDeferred.promise)
    mockedGetPlantPhotos.mockReturnValueOnce(photosDeferred.promise)

    render(<PlantDiagnosePage />)

    expect(screen.getByText("Cargando fotos...")).toBeInTheDocument()

    plantDeferred.resolve(makePlant())
    photosDeferred.resolve([])

    expect(await screen.findByText("Aun no hay fotos para esta planta.")).toBeInTheDocument()
  })

  it("shows empty state with CTA to photos page", async () => {
    mockedGetPlantById.mockResolvedValueOnce(makePlant())
    mockedGetPlantPhotos.mockResolvedValueOnce([])

    render(<PlantDiagnosePage />)

    expect(await screen.findByText("Aun no hay fotos para esta planta.")).toBeInTheDocument()
    const cta = screen.getByRole("link", { name: "Ir a fotos" })
    expect(cta).toHaveAttribute("href", "/garden/plant-qa-26/photos")
  })

  it("shows visible error when initial data load fails", async () => {
    mockedGetPlantById.mockRejectedValueOnce({
      code: "DB_ERROR",
      message: "No se pudo cargar planta",
    })
    mockedGetPlantPhotos.mockResolvedValueOnce([])

    render(<PlantDiagnosePage />)

    expect(await screen.findByText("No se pudo cargar planta")).toBeInTheDocument()
  })

  it("calls diagnose API with selected photo and renders success blocks", async () => {
    const user = userEvent.setup()

    mockedGetPlantById.mockResolvedValueOnce(makePlant())
    mockedGetPlantPhotos.mockResolvedValueOnce([
      makePhoto("photo-1", "Foto A", "https://img.test/photo-a.jpg"),
      makePhoto("photo-2", "Foto B", "https://img.test/photo-b.jpg"),
    ])

    const diagnosis: DiagnosePlantPhotoResponse = {
      diagnosis_id: "diag-123",
      possible_causes: ["Posible estres hidrico"],
      action_plan: ["Riego ligero y revisar drenaje"],
      confirmation_questions: ["¿Las hojas crujen al doblarlas?"],
    }

    mockedDiagnosePlantPhoto.mockResolvedValueOnce(diagnosis)

    render(<PlantDiagnosePage />)

    expect(await screen.findByText("Selecciona una foto")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Foto B/i }))
    await user.click(screen.getByRole("button", { name: "Analizar con Toni" }))

    await waitFor(() => {
      expect(mockedDiagnosePlantPhoto).toHaveBeenCalledWith({
        plant_id: "plant-qa-26",
        photo_url: "https://img.test/photo-b.jpg",
      })
    })

    expect(await screen.findByText("Resultado del diagnostico")).toBeInTheDocument()
    expect(screen.getByText("Posibles causas")).toBeInTheDocument()
    expect(screen.getByText("Plan de accion")).toBeInTheDocument()
    expect(screen.getByText("Preguntas de confirmacion")).toBeInTheDocument()
    expect(screen.getByText("Posible estres hidrico")).toBeInTheDocument()
  })

  it("shows diagnosis error message when analyze fails", async () => {
    const user = userEvent.setup()

    mockedGetPlantById.mockResolvedValueOnce(makePlant())
    mockedGetPlantPhotos.mockResolvedValueOnce([
      makePhoto("photo-1", "Foto A", "https://img.test/photo-a.jpg"),
    ])
    mockedDiagnosePlantPhoto.mockRejectedValueOnce({
      code: "HTTP_500",
      message: "Error al diagnosticar",
    })

    render(<PlantDiagnosePage />)

    await screen.findByText("Selecciona una foto")
    await user.click(screen.getByRole("button", { name: "Analizar con Toni" }))

    expect(await screen.findByText("Error al diagnosticar")).toBeInTheDocument()
  })
})
