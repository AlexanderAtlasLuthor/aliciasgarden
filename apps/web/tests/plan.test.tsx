import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PlanPage from "@/app/(tabs)/plan/page"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  getWeeklyPlan: vi.fn(),
  completeWeeklyPlanTask: vi.fn(),
  getPlants: vi.fn(),
  createManualWeeklyPlanTask: vi.fn(),
}))

const mockedGetWeeklyPlan = vi.mocked(api.getWeeklyPlan)
const mockedCompleteWeeklyPlanTask = vi.mocked(api.completeWeeklyPlanTask)
const mockedGetPlants = vi.mocked(api.getPlants)
const mockedCreateManualWeeklyPlanTask = vi.mocked(api.createManualWeeklyPlanTask)

type PlanTask = {
  task_id: string
  plant_id: string | null
  plant_name: string
  kind: string
  title: string
  reason: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "completed"
  completed_at?: string | null
}

function makeTask(input: Partial<PlanTask> & Pick<PlanTask, "task_id" | "plant_name" | "title" | "reason" | "due_date">): PlanTask {
  return {
    task_id: input.task_id,
    plant_id: input.plant_id ?? "plant-1",
    plant_name: input.plant_name,
    kind: input.kind ?? "watering",
    title: input.title,
    reason: input.reason,
    due_date: input.due_date,
    priority: input.priority ?? "medium",
    status: input.status ?? "pending",
    completed_at: input.completed_at ?? null,
  }
}

function expectMetricValue(label: string, value: string): void {
  const metricLabel = screen.getByText(label)
  const metricCard = metricLabel.parentElement
  expect(metricCard).not.toBeNull()
  expect(metricCard).toHaveTextContent(value)
}

describe("plan page - subfase 6", () => {
  beforeEach(() => {
    mockedGetWeeklyPlan.mockReset()
    mockedCompleteWeeklyPlanTask.mockReset()
    mockedGetPlants.mockReset()
    mockedCreateManualWeeklyPlanTask.mockReset()

    mockedGetPlants.mockResolvedValue([
      {
        id: "plant-1",
        profile_id: "profile-1",
        nickname: "Monstera",
        species_common: null,
        location: null,
        light: null,
        watering_interval_days: null,
        notes: null,
        created_at: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "plant-2",
        profile_id: "profile-1",
        nickname: "Poto",
        species_common: null,
        location: null,
        light: null,
        watering_interval_days: null,
        notes: null,
        created_at: "2026-03-01T00:00:00.000Z",
      },
    ])
  })

  it("renderiza barra de progreso por planta", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_name: "Monstera", title: "T1", reason: "R1", due_date: "2026-03-09", status: "completed" }),
        makeTask({ task_id: "t2", plant_name: "Monstera", title: "T2", reason: "R2", due_date: "2026-03-10", status: "pending" }),
        makeTask({ task_id: "t3", plant_name: "Monstera", title: "T3", reason: "R3", due_date: "2026-03-11", status: "pending" }),
      ],
    })

    render(<PlanPage />)

    expect(await screen.findByText("Monstera")).toBeInTheDocument()
    expect(screen.getByText("1 de 3 tareas completadas")).toBeInTheDocument()
    expect(screen.getByText("33%")).toBeInTheDocument()
  })

  it("el progreso cambia cuando se completa una tarea", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_name: "Monstera", title: "T1", reason: "R1", due_date: "2026-03-09", status: "completed" }),
        makeTask({ task_id: "t2", plant_name: "Monstera", title: "T2", reason: "R2", due_date: "2026-03-10", status: "pending" }),
      ],
    })

    mockedCompleteWeeklyPlanTask.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_name: "Monstera", title: "T1", reason: "R1", due_date: "2026-03-09", status: "completed" }),
        makeTask({ task_id: "t2", plant_name: "Monstera", title: "T2", reason: "R2", due_date: "2026-03-10", status: "completed", completed_at: "2026-03-10T10:00:00.000Z" }),
      ],
    })

    const user = userEvent.setup()
    render(<PlanPage />)

    expect(await screen.findByText("1 de 2 tareas completadas")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Marcar como hecho" }))

    expect(await screen.findByText("2 de 2 tareas completadas")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("muestra boton Anadir tarea y abre formulario", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [makeTask({ task_id: "t1", plant_name: "Monstera", title: "T1", reason: "R1", due_date: "2026-03-09" })],
    })

    const user = userEvent.setup()
    render(<PlanPage />)

    const addButton = await screen.findByRole("button", { name: "Anadir tarea" })
    expect(addButton).toBeInTheDocument()

    await user.click(addButton)
    expect(screen.getByText("Nueva tarea manual")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar tarea" })).toBeInTheDocument()
  })

  it("guardar tarea manual llama API y renderiza tarea en grupo correcto", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_id: "plant-1", plant_name: "Monstera", title: "Regar", reason: "R1", due_date: "2026-03-09" }),
      ],
    })

    mockedCreateManualWeeklyPlanTask.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_id: "plant-1", plant_name: "Monstera", title: "Regar", reason: "R1", due_date: "2026-03-09" }),
        makeTask({
          task_id: "manual-1",
          plant_id: "plant-2",
          plant_name: "Poto",
          kind: "manual",
          title: "Podar Poto",
          reason: "Hojas secas",
          due_date: "2026-03-11",
          priority: "high",
          status: "pending",
          completed_at: null,
        }),
      ],
    })

    const user = userEvent.setup()
    render(<PlanPage />)

    await user.click(await screen.findByRole("button", { name: "Anadir tarea" }))

    await user.selectOptions(screen.getByLabelText("Planta"), "plant-2")
    await user.type(screen.getByLabelText("Titulo"), "Podar Poto")
    await user.type(screen.getByLabelText("Motivo o nota"), "Hojas secas")
    await user.selectOptions(screen.getByLabelText("Prioridad"), "high")
    await user.clear(screen.getByLabelText("Fecha"))
    await user.type(screen.getByLabelText("Fecha"), "2026-03-11")

    await user.click(screen.getByRole("button", { name: "Guardar tarea" }))

    expect(mockedCreateManualWeeklyPlanTask).toHaveBeenCalledWith({
      plant_id: "plant-2",
      title: "Podar Poto",
      reason: "Hojas secas",
      priority: "high",
      due_date: "2026-03-11",
    })

    expect(await screen.findByRole("heading", { name: "Poto" })).toBeInTheDocument()
    expect(screen.getByText("Podar Poto")).toBeInTheDocument()
    expect(screen.getByText("Manual")).toBeInTheDocument()
  })

  it("actualiza metricas y progreso tras agregar tarea manual", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_id: "plant-1", plant_name: "Monstera", title: "Regar", reason: "R1", due_date: "2026-03-09", status: "completed" }),
      ],
    })

    mockedCreateManualWeeklyPlanTask.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_id: "plant-1", plant_name: "Monstera", title: "Regar", reason: "R1", due_date: "2026-03-09", status: "completed" }),
        makeTask({ task_id: "manual-2", plant_id: "plant-1", plant_name: "Monstera", kind: "manual", title: "Limpiar hojas", reason: "Polvo", due_date: "2026-03-10", priority: "low", status: "pending" }),
      ],
    })

    const user = userEvent.setup()
    render(<PlanPage />)

    expect(await screen.findByText("1 de 1 tareas completadas")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
    expectMetricValue("Pendientes", "0")
    expectMetricValue("Total tareas", "1")

    await user.click(screen.getByRole("button", { name: "Anadir tarea" }))
    await user.type(screen.getByLabelText("Titulo"), "Limpiar hojas")
    await user.type(screen.getByLabelText("Motivo o nota"), "Polvo")
    await user.clear(screen.getByLabelText("Fecha"))
    await user.type(screen.getByLabelText("Fecha"), "2026-03-10")
    await user.click(screen.getByRole("button", { name: "Guardar tarea" }))

    expect(await screen.findByText("1 de 2 tareas completadas")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
    expectMetricValue("Pendientes", "1")
    expectMetricValue("Total tareas", "2")
    expectMetricValue("Plantas activas", "1")
  })

  it("maneja error al guardar tarea manual sin romper la pagina", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_id: "plant-1", plant_name: "Monstera", title: "Regar", reason: "R1", due_date: "2026-03-09" }),
      ],
    })

    mockedCreateManualWeeklyPlanTask.mockRejectedValueOnce(new Error("No se pudo guardar"))

    const user = userEvent.setup()
    render(<PlanPage />)

    await user.click(await screen.findByRole("button", { name: "Anadir tarea" }))
    await user.type(screen.getByLabelText("Titulo"), "Podar")
    await user.type(screen.getByLabelText("Motivo o nota"), "Rama larga")
    await user.clear(screen.getByLabelText("Fecha"))
    await user.type(screen.getByLabelText("Fecha"), "2026-03-10")
    await user.click(screen.getByRole("button", { name: "Guardar tarea" }))

    expect(await screen.findByText("No se pudo guardar")).toBeInTheDocument()
    expect(screen.getByText("Regar")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar tarea" })).toBeInTheDocument()
  })

  it("mantiene estados loading error y empty", async () => {
    mockedGetPlants.mockResolvedValue([])
    mockedGetWeeklyPlan.mockReturnValueOnce(new Promise(() => undefined))

    const loadingView = render(<PlanPage />)
    expect(screen.getByText("Preparando agenda")).toBeInTheDocument()
    loadingView.unmount()

    mockedGetWeeklyPlan.mockRejectedValueOnce(new Error("Fallo plan"))
    const errorView = render(<PlanPage />)
    expect(await screen.findByText("No pudimos cargar tu plan")).toBeInTheDocument()
    errorView.unmount()

    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [],
    })

    render(<PlanPage />)
    expect(await screen.findByText("No hay tareas para esta semana")).toBeInTheDocument()
  })

  it("mantiene agrupacion y orden por fecha despues de actualizar", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_name: "Monstera", title: "Tarea tarde", reason: "R1", due_date: "2026-03-12" }),
        makeTask({ task_id: "t2", plant_name: "Monstera", title: "Tarea temprano", reason: "R2", due_date: "2026-03-09" }),
      ],
    })

    mockedCompleteWeeklyPlanTask.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({ task_id: "t1", plant_name: "Monstera", title: "Tarea tarde", reason: "R1", due_date: "2026-03-12" }),
        makeTask({ task_id: "t2", plant_name: "Monstera", title: "Tarea temprano", reason: "R2", due_date: "2026-03-09", status: "completed", completed_at: "2026-03-09T09:00:00.000Z" }),
      ],
    })

    const user = userEvent.setup()
    render(<PlanPage />)

    await screen.findByRole("heading", { name: "Monstera" })
    const section = screen.getByRole("heading", { name: "Monstera" }).closest("section")
    expect(section).not.toBeNull()
    const beforeText = section?.textContent ?? ""
    expect(beforeText.indexOf("Tarea temprano")).toBeLessThan(beforeText.indexOf("Tarea tarde"))

    const pendingEarlyTask = screen.getByText("Tarea temprano").closest("li")
    await user.click(within(pendingEarlyTask as HTMLElement).getByRole("button", { name: "Marcar como hecho" }))

    const afterSection = screen.getByRole("heading", { name: "Monstera" }).closest("section")
    const afterText = afterSection?.textContent ?? ""
    expect(afterText.indexOf("Tarea temprano")).toBeLessThan(afterText.indexOf("Tarea tarde"))
  })
})
