"use client"

import { useEffect, useMemo, useState } from "react"

import {
  completeWeeklyPlanTask,
  getWeeklyPlan,
  type WeeklyPlanTask,
} from "@/lib/api"

function formatWeekStartLabel(weekStart: string | null): string {
  if (!weekStart) {
    return "Semana actual"
  }

  const parsed = new Date(`${weekStart}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    return `Semana de ${weekStart}`
  }

  return `Semana de ${parsed.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })}`
}

function priorityLabel(priority: WeeklyPlanTask["priority"]): string {
  if (priority === "high") {
    return "Alta"
  }

  if (priority === "medium") {
    return "Media"
  }

  return "Baja"
}

function priorityClass(priority: WeeklyPlanTask["priority"]): string {
  if (priority === "high") {
    return "border-red-300/30 bg-red-300/15 text-red-100"
  }

  if (priority === "medium") {
    return "border-amber-300/30 bg-amber-300/15 text-amber-100"
  }

  return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
}

function formatDueDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
}

function completionText(pendingTasks: number, totalTasks: number): string {
  if (totalTasks === 0) {
    return "Sin tareas esta semana"
  }

  if (pendingTasks === totalTasks) {
    return "Semana por comenzar"
  }

  return `${pendingTasks} por resolver`
}

export default function PlanPage() {
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [tasks, setTasks] = useState<WeeklyPlanTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)

  const getErrorMessage = (loadError: unknown, fallbackMessage: string): string => {
    if (loadError && typeof loadError === "object" && "message" in loadError) {
      const message = (loadError as { message?: unknown }).message
      if (typeof message === "string" && message.trim()) {
        return message
      }
    }

    return fallbackMessage
  }

  const loadPlan = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const plan = await getWeeklyPlan()
      setWeekStart(plan.week_start)
      setTasks(Array.isArray(plan.tasks) ? plan.tasks : [])
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError, "No pudimos cargar tu plan semanal. Intenta de nuevo."))
    } finally {
      setIsLoading(false)
    }
  }

  const onCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId)

    try {
      const plan = await completeWeeklyPlanTask(taskId)
      setWeekStart(plan.week_start)
      setTasks(Array.isArray(plan.tasks) ? plan.tasks : [])
    } catch {
      // Keep checklist state as-is if the completion request fails.
    } finally {
      setCompletingTaskId((current) => (current === taskId ? null : current))
    }
  }

  useEffect(() => {
    void loadPlan()
  }, [])

  const totalTasks = tasks.length
  const pendingTasks = tasks.filter((task) => task.status === "pending").length
  const highPriorityTasks = tasks.filter((task) => task.priority === "high").length
  const plantsWithTasks = useMemo(
    () => new Set(tasks.map((task) => task.plant_name.trim()).filter(Boolean)).size,
    [tasks]
  )

  const tasksByPlant = useMemo(() => {
    const grouped = new Map<string, WeeklyPlanTask[]>()

    for (const task of tasks) {
      const plantName = task.plant_name?.trim() || "Sin planta"
      const list = grouped.get(plantName) ?? []
      list.push(task)
      grouped.set(plantName, list)
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "es"))
      .map(([plantName, plantTasks]) => ({
        plantName,
        highPriorityCount: plantTasks.filter((task) => task.priority === "high").length,
        tasks: plantTasks.slice().sort((a, b) => a.due_date.localeCompare(b.due_date)),
      }))
  }, [tasks])

  const hasData = !isLoading && tasks.length > 0

  return (
    <div className="ag-container ag-screen">
      <div className="ag-panel space-y-6">
        <div className="relative overflow-hidden rounded-[calc(var(--radius-4)+2px)] border border-white/12 bg-[linear-gradient(135deg,rgba(88,255,138,0.17),rgba(54,180,133,0.08)_38%,rgba(7,31,22,0.45)_100%)] px-5 py-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(88,255,138,0.42),rgba(88,255,138,0))] blur-xl" />
          <div className="pointer-events-none absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(166,255,221,0.24),rgba(166,255,221,0))] blur-lg" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-hairline text-xs uppercase tracking-[0.24em]">Plan Semanal</p>
              <h1 className="text-primary text-2xl font-semibold tracking-tight">Cuidados inteligentes</h1>
              <p className="text-secondary text-sm">{formatWeekStartLabel(weekStart)}</p>
            </div>

            <div className="rounded-full border border-white/15 bg-black/15 px-3 py-1 text-xs text-secondary">
              {isLoading ? "Preparando agenda" : completionText(pendingTasks, totalTasks)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[var(--radius-3)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-4">
            <p className="text-hairline text-xs uppercase tracking-[0.14em]">Pendientes</p>
            <p className="text-primary mt-1 text-2xl font-semibold">{isLoading ? "—" : pendingTasks}</p>
          </div>
          <div className="rounded-[var(--radius-3)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-4">
            <p className="text-hairline text-xs uppercase tracking-[0.14em]">Plantas activas</p>
            <p className="text-primary mt-1 text-2xl font-semibold">{isLoading ? "—" : plantsWithTasks}</p>
          </div>
          <div className="rounded-[var(--radius-3)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-4">
            <p className="text-hairline text-xs uppercase tracking-[0.14em]">Total tareas</p>
            <p className="text-primary mt-1 text-2xl font-semibold">{isLoading ? "—" : totalTasks}</p>
          </div>
          <div className="rounded-[var(--radius-3)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-4">
            <p className="text-hairline text-xs uppercase tracking-[0.14em]">Alta prioridad</p>
            <p className="text-primary mt-1 text-2xl font-semibold">{isLoading ? "—" : highPriorityTasks}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/6 px-4 py-5">
              <div className="h-3 w-28 rounded bg-white/15" />
              <div className="mt-3 h-3 w-44 rounded bg-white/10" />
              <div className="mt-2 h-3 w-36 rounded bg-white/10" />
            </div>
            <div className="animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/6 px-4 py-5">
              <div className="h-3 w-24 rounded bg-white/15" />
              <div className="mt-3 h-3 w-40 rounded bg-white/10" />
              <div className="mt-2 h-3 w-32 rounded bg-white/10" />
            </div>
          </div>
        ) : null}

        {!isLoading && error && tasks.length === 0 ? (
          <div className="rounded-[var(--radius-3)] border border-red-300/25 bg-[linear-gradient(180deg,rgba(255,90,90,0.15),rgba(255,90,90,0.08))] px-4 py-4">
            <p className="text-primary font-medium">No pudimos cargar tu plan</p>
            <p className="text-secondary mt-1 text-sm">{error}</p>
          </div>
        ) : null}

        {!isLoading && !error && tasks.length === 0 ? (
          <div className="rounded-[var(--radius-3)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-5">
            <p className="text-primary font-medium">No hay tareas para esta semana</p>
            <p className="text-secondary mt-1 text-sm">Tu jardín está al día. Vuelve pronto para revisar nuevas sugerencias.</p>
          </div>
        ) : null}

        {hasData ? (
          <div className="space-y-3">
            {tasksByPlant.map((group) => (
              <section
                key={group.plantName}
                className="rounded-[var(--radius-3)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-primary text-base font-semibold">{group.plantName}</h2>
                    <p className="text-secondary text-xs">{group.tasks.length} tareas esta semana</p>
                  </div>
                  {group.highPriorityCount > 0 ? (
                    <span className="rounded-full border border-red-300/30 bg-red-300/15 px-2.5 py-1 text-[11px] font-medium text-red-100">
                      {group.highPriorityCount} alta prioridad
                    </span>
                  ) : null}
                </div>

                <ul className="space-y-2">
                  {group.tasks.map((task) => (
                    <li
                      key={task.task_id}
                      className={`rounded-[var(--radius-2)] border px-3 py-3 transition-colors ${
                        task.status === "completed"
                          ? "border-emerald-300/25 bg-emerald-300/10"
                          : "border-white/10 bg-black/10 hover:bg-black/15"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            task.status === "completed"
                              ? "text-secondary line-through decoration-white/30"
                              : "text-primary"
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-secondary text-[11px]">{formatDueDate(task.due_date)}</span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${priorityClass(task.priority)}`}
                          >
                            {priorityLabel(task.priority)}
                          </span>
                          {task.status === "completed" ? (
                            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2 py-0.5 text-[11px] font-medium text-emerald-100">
                              Hecho
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-secondary mt-1 text-sm">{task.reason}</p>
                      {task.status === "pending" ? (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                            onClick={() => {
                              void onCompleteTask(task.task_id)
                            }}
                            disabled={completingTaskId === task.task_id}
                          >
                            {completingTaskId === task.task_id ? "Guardando..." : "Marcar como hecho"}
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
