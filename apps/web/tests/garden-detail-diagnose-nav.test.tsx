import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PlantDetailPage from "@/app/(tabs)/garden/[plantId]/page"
import type { Plant } from "@/lib/api"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  createPlantEvent: vi.fn(),
  deletePlant: vi.fn(),
  deletePlantEvent: vi.fn(),
  getPlantById: vi.fn(),
  getPlantEvents: vi.fn(),
  isAPIError: vi.fn(() => false),
  patchPlant: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({
    plantId: "plant-qa-26",
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

describe("garden/[plantId] navigation to diagnose", () => {
  beforeEach(() => {
    mockedGetPlantById.mockReset()
    mockedGetPlantEvents.mockReset()

    mockedGetPlantById.mockResolvedValue(makePlant())
    mockedGetPlantEvents.mockResolvedValue([])
  })

  it("shows link to /garden/[plantId]/diagnose from plant detail", async () => {
    render(<PlantDetailPage />)

    const link = await screen.findByRole("link", { name: "Diagnostico por foto" })
    expect(link).toHaveAttribute("href", "/garden/plant-qa-26/diagnose")
  })
})
