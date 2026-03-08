import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PlanPage from "@/app/(tabs)/plan/page"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  generateWeeklyPlan: vi.fn(),
  getWeeklyPlan: vi.fn(),
  completeWeeklyPlanTask: vi.fn(),
}))

const mockedGetWeeklyPlan = vi.mocked(api.getWeeklyPlan)
const mockedCompleteWeeklyPlanTask = vi.mocked(api.completeWeeklyPlanTask)

function expectMetricValue(label: string, value: string): void {
  const metricLabel = screen.getByText(label)
  const metricCard = metricLabel.parentElement
  expect(metricCard).not.toBeNull()
  expect(metricCard).toHaveTextContent(value)
}

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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe("plan page", () => {
  beforeEach(() => {
    mockedGetWeeklyPlan.mockReset()
    mockedCompleteWeeklyPlanTask.mockReset()
  })

  it("carga inicial usa plan persistido con getWeeklyPlan", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({
          task_id: "t1",
          plant_name: "Monstera",
          title: "Regar Monstera",
          reason: "Han pasado 7 dias.",
          due_date: "2026-03-09",
        }),
      ],
    })

    render(<PlanPage />)

    expect(await screen.findByText("Regar Monstera")).toBeInTheDocument()
    expect(mockedGetWeeklyPlan).toHaveBeenCalledTimes(1)
    expect(mockedCompleteWeeklyPlanTask).not.toHaveBeenCalled()
  })

  it("renderiza boton Marcar como hecho para tareas pending", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({
          task_id: "t1",
          plant_name: "Monstera",
          title: "Regar Monstera",
          reason: "Han pasado 7 dias.",
          due_date: "2026-03-09",
          status: "pending",
        }),
      ],
    })

    render(<PlanPage />)

    expect(await screen.findByRole("button", { name: "Marcar como hecho" })).toBeInTheDocument()
  })

  it("no renderiza boton para tareas completed y muestra estado visual", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({
          task_id: "t1",
          plant_name: "Monstera",
          title: "Regar Monstera",
          reason: "Han pasado 7 dias.",
          due_date: "2026-03-09",
          status: "completed",
          completed_at: "2026-03-09T08:00:00.000Z",
        }),
      ],
    })

    render(<PlanPage />)

    expect(await screen.findByText("Regar Monstera")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Marcar como hecho" })).not.toBeInTheDocument()
    expect(screen.getByText("Hecho")).toBeInTheDocument()
  })

  it("completar tarea actualiza checklist y metricas", async () => {
    const initialTasks: PlanTask[] = [
      makeTask({
        task_id: "t1",
        plant_name: "Monstera",
        title: "Regar Monstera",
        reason: "Han pasado 7 dias.",
        due_date: "2026-03-09",
        priority: "high",
        status: "pending",
      }),
      makeTask({
        task_id: "t2",
        plant_name: "Monstera",
        title: "Tomar foto",
        reason: "No hay foto reciente.",
        due_date: "2026-03-10",
        priority: "low",
        status: "pending",
      }),
    ]

    const updatedTasks: PlanTask[] = [
      {
        ...initialTasks[0],
        status: "completed",
        completed_at: "2026-03-09T12:00:00.000Z",
      },
      initialTasks[1],
    ]

    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: initialTasks,
    })

    mockedCompleteWeeklyPlanTask.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: updatedTasks,
    })

    const user = userEvent.setup()
    render(<PlanPage />)

    const actionButtons = await screen.findAllByRole("button", { name: "Marcar como hecho" })
    const actionButton = actionButtons[0]
    await user.click(actionButton)

    expect(mockedCompleteWeeklyPlanTask).toHaveBeenCalledWith("t1")
    expect(await screen.findByText("Hecho")).toBeInTheDocument()
    expect(screen.getByText("Regar Monstera")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Marcar como hecho" })).toBeInTheDocument()

    expectMetricValue("Pendientes", "1")
    expectMetricValue("Total tareas", "2")
    expectMetricValue("Alta prioridad", "1")
    expectMetricValue("Plantas activas", "1")
  })

  it("durante completado deshabilita solo el boton de la tarea activa", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({
          task_id: "t1",
          plant_name: "Monstera",
          title: "Regar Monstera",
          reason: "Han pasado 7 dias.",
          due_date: "2026-03-09",
        }),
        makeTask({
          task_id: "t2",
          plant_name: "Poto",
          title: "Tomar foto",
          reason: "No hay foto reciente.",
          due_date: "2026-03-10",
        }),
      ],
    })

    const completionRequest = deferred<{ week_start: string; tasks: PlanTask[] }>()
    mockedCompleteWeeklyPlanTask.mockReturnValueOnce(completionRequest.promise)

    const user = userEvent.setup()
    render(<PlanPage />)

    const buttons = await screen.findAllByRole("button", { name: "Marcar como hecho" })
    expect(buttons).toHaveLength(2)

    await user.click(buttons[0])

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled()
    })

    const stillEnabledButton = screen.getByRole("button", { name: "Marcar como hecho" })
    expect(stillEnabledButton).toBeEnabled()

    completionRequest.resolve({
      week_start: "2026-03-02",
      tasks: [
        makeTask({
          task_id: "t1",
          plant_name: "Monstera",
          title: "Regar Monstera",
          reason: "Han pasado 7 dias.",
          due_date: "2026-03-09",
          status: "completed",
          completed_at: "2026-03-09T09:00:00.000Z",
        }),
        makeTask({
          task_id: "t2",
          plant_name: "Poto",
          title: "Tomar foto",
          reason: "No hay foto reciente.",
          due_date: "2026-03-10",
          status: "pending",
        }),
      ],
    })

    expect(await screen.findByText("Hecho")).toBeInTheDocument()
  })

  it("mantiene agrupacion y orden por fecha despues del update", async () => {
    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({
          task_id: "t1",
          plant_name: "Monstera",
          title: "Tarea tarde",
          reason: "Razon 1",
          due_date: "2026-03-12",
          status: "pending",
        }),
        makeTask({
          task_id: "t2",
          plant_name: "Monstera",
          title: "Tarea temprano",
          reason: "Razon 2",
          due_date: "2026-03-09",
          status: "pending",
        }),
        makeTask({
          task_id: "t3",
          plant_name: "Poto",
          title: "Tarea poto",
          reason: "Razon 3",
          due_date: "2026-03-11",
          status: "pending",
        }),
      ],
    })

    mockedCompleteWeeklyPlanTask.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({
          task_id: "t1",
          plant_name: "Monstera",
          title: "Tarea tarde",
          reason: "Razon 1",
          due_date: "2026-03-12",
          status: "pending",
        }),
        makeTask({
          task_id: "t2",
          plant_name: "Monstera",
          title: "Tarea temprano",
          reason: "Razon 2",
          due_date: "2026-03-09",
          status: "completed",
          completed_at: "2026-03-09T09:00:00.000Z",
        }),
        makeTask({
          task_id: "t3",
          plant_name: "Poto",
          title: "Tarea poto",
          reason: "Razon 3",
          due_date: "2026-03-11",
          status: "pending",
        }),
      ],
    })

    const user = userEvent.setup()
    render(<PlanPage />)

    await screen.findByRole("heading", { name: "Monstera" })
    const monsteraSectionBefore = screen.getByRole("heading", { name: "Monstera" }).closest("section")
    expect(monsteraSectionBefore).not.toBeNull()
    const beforeText = monsteraSectionBefore?.textContent ?? ""
    expect(beforeText.indexOf("Tarea temprano")).toBeLessThan(beforeText.indexOf("Tarea tarde"))

    const pendingEarlyTask = screen.getByText("Tarea temprano").closest("li")
    expect(pendingEarlyTask).not.toBeNull()
    const firstMonsteraAction = within(pendingEarlyTask as HTMLElement).getByRole("button", {
      name: "Marcar como hecho",
    })
    await user.click(firstMonsteraAction)

    expect(await screen.findByText("Hecho")).toBeInTheDocument()

    const monsteraSectionAfter = screen.getByRole("heading", { name: "Monstera" }).closest("section")
    expect(monsteraSectionAfter).not.toBeNull()
    const afterText = monsteraSectionAfter?.textContent ?? ""
    expect(afterText.indexOf("Tarea temprano")).toBeLessThan(afterText.indexOf("Tarea tarde"))
    expect(screen.getByRole("heading", { name: "Poto" })).toBeInTheDocument()
  })

  it("mantiene estados loading, error y empty con getWeeklyPlan", async () => {
    mockedGetWeeklyPlan.mockReturnValueOnce(new Promise(() => undefined))

    const loadingView = render(<PlanPage />)
    expect(screen.getByText("Preparando agenda")).toBeInTheDocument()
    loadingView.unmount()

    mockedGetWeeklyPlan.mockRejectedValueOnce(new Error("Fallo plan"))
    const errorView = render(<PlanPage />)
    expect(await screen.findByText("No pudimos cargar tu plan")).toBeInTheDocument()
    expect(screen.getByText("Fallo plan")).toBeInTheDocument()
    errorView.unmount()

    mockedGetWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [],
    })

    render(<PlanPage />)
    expect(await screen.findByText("No hay tareas para esta semana")).toBeInTheDocument()
    expectMetricValue("Pendientes", "0")
    expectMetricValue("Plantas activas", "0")
    expectMetricValue("Total tareas", "0")
    expectMetricValue("Alta prioridad", "0")
  })
})
