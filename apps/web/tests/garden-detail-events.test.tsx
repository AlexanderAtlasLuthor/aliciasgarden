import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PlantDetailPage from "@/app/(tabs)/garden/[plantId]/page"
import type { CareEvent, Plant } from "@/lib/api"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  createPlantEvent: vi.fn(),
  deletePlantEvent: vi.fn(),
  getPlantById: vi.fn(),
  getPlantEvents: vi.fn(),
  isAPIError: vi.fn(() => false),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({
    plantId: "plant-qa-26",
  }),
}))

const mockedGetPlantById = vi.mocked(api.getPlantById)
const mockedGetPlantEvents = vi.mocked(api.getPlantEvents)
const mockedCreatePlantEvent = vi.mocked(api.createPlantEvent)
const mockedDeletePlantEvent = vi.mocked(api.deletePlantEvent)

const makePlant = (): Plant => ({
  id: "plant-qa-26",
  profile_id: "profile-1",
  nickname: "Monstera QA",
  species_common: "Monstera deliciosa",
  location: "Sala",
  light: "Indirecta",
  watering_interval_days: 7,
  notes: null,
  created_at: "2026-03-05T00:00:00.000Z",
})

const makeEvent = (
  id: string,
  type: CareEvent["type"],
  details: Record<string, unknown>
): CareEvent => ({
  id,
  profile_id: "profile-1",
  plant_id: "plant-qa-26",
  type,
  details,
  event_at: "2026-03-05T10:00:00.000Z",
  created_at: "2026-03-05T10:00:00.000Z",
})

describe("garden/[plantId] generic event tracking", () => {
  beforeEach(() => {
    mockedGetPlantById.mockReset()
    mockedGetPlantEvents.mockReset()
    mockedCreatePlantEvent.mockReset()
    mockedDeletePlantEvent.mockReset()

    mockedGetPlantById.mockResolvedValue(makePlant())
    mockedDeletePlantEvent.mockResolvedValue()
  })

  it("renders event composer, sends generic payloads, shows snackbar, and supports undo", async () => {
    const user = userEvent.setup()

    const noteEvent = makeEvent("event-note-1", "note", { text: "Nota QA 2.6" })
    const fertilizeEvent = makeEvent("event-fertilize-1", "fertilize", { notes: "Abono QA 2.6" })

    mockedGetPlantEvents
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([noteEvent])
      .mockResolvedValueOnce([fertilizeEvent, noteEvent])
      .mockResolvedValueOnce([noteEvent])

    mockedCreatePlantEvent
      .mockResolvedValueOnce(noteEvent)
      .mockResolvedValueOnce(fertilizeEvent)

    render(<PlantDetailPage />)

    const composerTitle = await screen.findByText("Registrar evento")
    expect(composerTitle).toBeInTheDocument()

    const composer = composerTitle.closest("div")
    if (!composer) {
      throw new Error("Composer block not found")
    }

    expect(within(composer).getByRole("button", { name: "Guardar evento" })).toBeInTheDocument()

    await user.click(within(composer).getByRole("button", { name: /Nota/i }))
    await user.type(within(composer).getByRole("textbox"), "Nota QA 2.6")
    await user.click(within(composer).getByRole("button", { name: "Guardar evento" }))

    await waitFor(() => {
      expect(mockedCreatePlantEvent).toHaveBeenNthCalledWith(1, "plant-qa-26", {
        type: "note",
        details: { text: "Nota QA 2.6" },
      })
    })

    expect(await screen.findByText("Evento registrado: Nota")).toBeInTheDocument()

    await user.click(within(composer).getByRole("button", { name: /Abono/i }))
    const input = within(composer).getByRole("textbox")
    await user.clear(input)
    await user.type(input, "Abono QA 2.6")
    await user.click(within(composer).getByRole("button", { name: "Guardar evento" }))

    await waitFor(() => {
      expect(mockedCreatePlantEvent).toHaveBeenNthCalledWith(2, "plant-qa-26", {
        type: "fertilize",
        details: { notes: "Abono QA 2.6" },
      })
    })

    expect(await screen.findByText("Evento registrado: Abono")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Deshacer" }))

    await waitFor(() => {
      expect(mockedDeletePlantEvent).toHaveBeenCalledWith("event-fertilize-1")
    })

    await waitFor(() => {
      expect(mockedGetPlantEvents).toHaveBeenCalledTimes(4)
    })

    await waitFor(() => {
      expect(screen.queryByText("Abono QA 2.6")).not.toBeInTheDocument()
    })
  })
})
