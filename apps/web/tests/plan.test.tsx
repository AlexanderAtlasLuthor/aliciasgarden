import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import PlanPage from "@/app/(tabs)/plan/page"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  generateWeeklyPlan: vi.fn()
}))

const mockedGenerateWeeklyPlan = vi.mocked(api.generateWeeklyPlan)

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
  status: "pending"
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
    status: "pending",
  }
}

describe("plan page", () => {
  beforeEach(() => {
    mockedGenerateWeeklyPlan.mockReset()
  })

  it("shows loading state while fetching plan", () => {
    mockedGenerateWeeklyPlan.mockReturnValue(new Promise(() => undefined))

    render(<PlanPage />)

    expect(screen.getByText("Preparando agenda")).toBeInTheDocument()
  })

  it("shows error state when generateWeeklyPlan fails", async () => {
    mockedGenerateWeeklyPlan.mockRejectedValueOnce(new Error("Fallo plan"))

    render(<PlanPage />)

    expect(await screen.findByText("No pudimos cargar tu plan")).toBeInTheDocument()
    expect(screen.getByText("Fallo plan")).toBeInTheDocument()
  })

  it("shows empty state when no tasks are returned", async () => {
    mockedGenerateWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [],
    })

    render(<PlanPage />)

    expect(await screen.findByText("No hay tareas para esta semana")).toBeInTheDocument()
    expect(mockedGenerateWeeklyPlan).toHaveBeenCalledWith({ profile_id: "default_profile" })
    expectMetricValue("Pendientes", "0")
    expectMetricValue("Plantas activas", "0")
    expectMetricValue("Total tareas", "0")
    expectMetricValue("Alta prioridad", "0")
  })

  it("renders real metrics and tasks grouped by plant", async () => {
    mockedGenerateWeeklyPlan.mockResolvedValueOnce({
      week_start: "2026-03-02",
      tasks: [
        makeTask({
          task_id: "t1",
          plant_name: "Monstera",
          title: "Regar Monstera",
          reason: "Han pasado 7 dias.",
          due_date: "2026-03-09",
          priority: "high",
        }),
        makeTask({
          task_id: "t2",
          plant_name: "Monstera",
          title: "Tomar foto",
          reason: "No hay foto reciente.",
          due_date: "2026-03-10",
          priority: "low",
        }),
        makeTask({
          task_id: "t3",
          plant_id: "plant-2",
          plant_name: "Poto",
          title: "Medir crecimiento",
          reason: "No hay medicion reciente.",
          due_date: "2026-03-11",
          priority: "medium",
        }),
      ],
    })

    render(<PlanPage />)

    expect(await screen.findByRole("heading", { name: "Cuidados inteligentes" })).toBeInTheDocument()

    expect(screen.getByText("Pendientes")).toBeInTheDocument()
    expect(screen.getByText("Plantas activas")).toBeInTheDocument()
    expect(screen.getByText("Total tareas")).toBeInTheDocument()
    expect(screen.getByText("Alta prioridad")).toBeInTheDocument()

    expectMetricValue("Pendientes", "3")
    expectMetricValue("Plantas activas", "2")
    expectMetricValue("Total tareas", "3")
    expectMetricValue("Alta prioridad", "1")

    expect(screen.getByRole("heading", { name: "Monstera" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Poto" })).toBeInTheDocument()

    expect(screen.getByText("Regar Monstera")).toBeInTheDocument()
    expect(screen.getByText("Han pasado 7 dias.")).toBeInTheDocument()
    expect(screen.getByText("Tomar foto")).toBeInTheDocument()
    expect(screen.getByText("No hay foto reciente.")).toBeInTheDocument()
    expect(screen.getByText("Medir crecimiento")).toBeInTheDocument()
    expect(screen.getByText("No hay medicion reciente.")).toBeInTheDocument()

    expect(screen.queryByText(/completar/i)).not.toBeInTheDocument()
  })
})
