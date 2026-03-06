"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import GlassSurface from "@/components/ui/GlassSurface"
import MetricTile from "@/components/ui/MetricTile"
import {
  createPlantEvent,
  deletePlantEvent,
  getPlantById,
  getPlantEvents,
  isAPIError,
  type CareEvent,
  type Plant,
} from "@/lib/api"
import PlantDetailLoading from "./loading"

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Fecha invalida"
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatDateOnly(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Fecha invalida"
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
  }).format(date)
}

function eventLabel(type: CareEvent["type"]): string {
  if (type === "water") return "Riego"
  if (type === "fertilize") return "Abono"
  if (type === "prune") return "Poda"
  if (type === "repot") return "Trasplante"
  if (type === "pest") return "Plaga"
  if (type === "treatment") return "Tratamiento"
  if (type === "note") return "Nota"
  return "Evento"
}

function eventIcon(type: CareEvent["type"]): string {
  if (type === "water") return "💧"
  if (type === "fertilize") return "🧪"
  if (type === "prune") return "✂️"
  if (type === "repot") return "🪴"
  if (type === "pest") return "🐛"
  if (type === "treatment") return "🩹"
  if (type === "note") return "📝"
  return "📌"
}

function eventDetailText(details: CareEvent["details"]): string | null {
  if (!details) {
    return null
  }

  const candidates = ["text", "notes", "note", "message", "comment", "details"]
  for (const key of candidates) {
    const value = details[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return null
}

type WaterSnackbarState = {
  message: string
  canUndo: boolean
}

const EVENT_TYPE_OPTIONS: Array<{ type: CareEvent["type"]; label: string }> = [
  { type: "water", label: "Riego" },
  { type: "fertilize", label: "Abono" },
  { type: "prune", label: "Poda" },
  { type: "repot", label: "Trasplante" },
  { type: "pest", label: "Plaga" },
  { type: "treatment", label: "Tratamiento" },
  { type: "note", label: "Nota" },
]

export default function PlantDetailPage() {
  const params = useParams<{ plantId: string }>()
  const plantId = params?.plantId ?? ""

  const [plant, setPlant] = useState<Plant | null>(null)
  const [events, setEvents] = useState<CareEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEventType, setSelectedEventType] = useState<CareEvent["type"]>("water")
  const [eventText, setEventText] = useState("")
  const [isRegisteringEvent, setIsRegisteringEvent] = useState(false)
  const [isUndoingEvent, setIsUndoingEvent] = useState(false)
  const [lastCreatedEventId, setLastCreatedEventId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<WaterSnackbarState | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSnackbarTimer = useCallback(() => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current)
      snackbarTimerRef.current = null
    }
  }, [])

  const showSnackbar = useCallback(
    (message: string, canUndo: boolean, hideAfterMs = 8_000) => {
      clearSnackbarTimer()
      setSnackbar({ message, canUndo })

      snackbarTimerRef.current = setTimeout(() => {
        setSnackbar(null)
        setLastCreatedEventId(null)
        snackbarTimerRef.current = null
      }, hideAfterMs)
    },
    [clearSnackbarTimer]
  )

  const loadData = useCallback(async () => {
    if (!plantId) {
      setErrorMessage("No encontramos el identificador de la planta.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [plantData, eventsData] = await Promise.all([
        getPlantById(plantId),
        getPlantEvents(plantId, 30),
      ])

      const sortedEvents = [...eventsData].sort(
        (a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime()
      )

      setPlant(plantData)
      setEvents(sortedEvents)
    } catch (error: unknown) {
      const fallbackMessage = "No pudimos cargar la ficha de planta."

      if (isAPIError(error) && error.message.trim()) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(fallbackMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [plantId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    return () => {
      clearSnackbarTimer()
    }
  }, [clearSnackbarTimer])

  const lastWater = useMemo(
    () => events.find((event) => event.type === "water") ?? null,
    [events]
  )

  const nextRecommendedDate = useMemo(() => {
    if (!plant?.watering_interval_days || !lastWater) {
      return null
    }

    const base = new Date(lastWater.event_at)
    if (Number.isNaN(base.getTime())) {
      return null
    }

    const next = new Date(base)
    next.setDate(next.getDate() + plant.watering_interval_days)
    return next
  }, [lastWater, plant?.watering_interval_days])

  const status = useMemo(() => {
    if (!plant?.watering_interval_days || !lastWater || !nextRecommendedDate) {
      return {
        label: "Sin datos",
        helper: "Configura intervalo y registra riegos para estimar estado.",
        variant: "default" as const,
      }
    }

    const threshold = new Date(nextRecommendedDate)
    threshold.setDate(threshold.getDate() + 2)

    if (new Date() <= threshold) {
      return {
        label: "OK",
        helper: "Riego dentro del rango recomendado.",
        variant: "good" as const,
      }
    }

    return {
      label: "Vigilar",
      helper: "Se paso la recomendacion por mas de 2 dias.",
      variant: "warn" as const,
    }
  }, [lastWater, nextRecommendedDate, plant?.watering_interval_days])

  const onRegisterWater = useCallback(async () => {
    if (!plantId || isRegisteringEvent) {
      return
    }

    setIsRegisteringEvent(true)
    setSnackbar(null)

    try {
      const details =
        selectedEventType === "note"
          ? { text: eventText }
          : { notes: eventText }

      const createdEvent = await createPlantEvent(plantId, {
        type: selectedEventType,
        details,
      })
      const refreshedEvents = await getPlantEvents(plantId, 30)
      const sortedEvents = [...refreshedEvents].sort(
        (a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime()
      )

      setEvents(sortedEvents)
      setEventText("")
      setLastCreatedEventId(createdEvent.id)
      showSnackbar(`Evento registrado: ${eventLabel(selectedEventType)}`, true, 8_000)
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        showSnackbar(error.message, false, 5_000)
      } else {
        showSnackbar("No pudimos registrar el evento. Intenta de nuevo.", false, 5_000)
      }
    } finally {
      setIsRegisteringEvent(false)
    }
  }, [eventText, isRegisteringEvent, plantId, selectedEventType, showSnackbar])

  const onUndoWater = useCallback(async () => {
    if (!plantId || !lastCreatedEventId || isUndoingEvent) {
      return
    }

    setIsUndoingEvent(true)

    try {
      await deletePlantEvent(lastCreatedEventId)
      const refreshedEvents = await getPlantEvents(plantId, 30)
      const sortedEvents = [...refreshedEvents].sort(
        (a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime()
      )

      setEvents(sortedEvents)
      setLastCreatedEventId(null)
      showSnackbar("Evento deshecho.", false, 2_000)
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        showSnackbar(error.message, false, 5_000)
      } else {
        showSnackbar("No pudimos deshacer el evento. Intenta de nuevo.", false, 5_000)
      }
    } finally {
      setIsUndoingEvent(false)
    }
  }, [isUndoingEvent, lastCreatedEventId, plantId, showSnackbar])

  const onClearEventComposer = useCallback(() => {
    setSelectedEventType("water")
    setEventText("")
  }, [])

  if (isLoading) {
    return (
      <div className="ag-container ag-screen">
        <div className="ag-panel">
          <PlantDetailLoading />
        </div>
      </div>
    )
  }

  if (errorMessage || !plant) {
    return (
      <div className="ag-container ag-screen">
        <div className="ag-panel space-y-4">
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link href="/garden">Volver al jardin</Link>
          </Button>

          <GlassSurface role="alert" className="space-y-3 border-red-300/30 bg-red-500/10 p-4" variant="strong">
            <p className="text-2xl" aria-hidden="true">🌿</p>
            <h1 className="text-lg font-semibold text-white">No pudimos cargar la ficha</h1>
            <p className="text-sm text-white/75">{errorMessage ?? "Planta no encontrada."}</p>
            <Button type="button" variant="primary" onClick={() => void loadData()}>
              Reintentar
            </Button>
          </GlassSurface>
        </div>
      </div>
    )
  }

  const timelineEvents = events.slice(0, 30)

  return (
    <div className="ag-container ag-screen">
      <div className="ag-panel relative space-y-6 pb-24">
        <section className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link href="/garden">Volver al jardin</Link>
          </Button>
          <h1 className="text-primary text-2xl font-semibold tracking-tight">{plant.nickname}</h1>
          <p className="text-secondary text-sm">{plant.species_common ?? "Ficha de planta"}</p>
        </section>

        <Card className="rounded-xl p-4" variant="strong">
          <CardContent className="space-y-4 p-0">
            <h2 className="text-primary text-lg font-semibold">Resumen</h2>
            <p className="text-secondary text-sm">
              <span className="text-primary font-medium">Ubicacion:</span>{" "}
              {plant.location ?? "Sin definir"}
            </p>
            <p className="text-secondary text-sm">
              <span className="text-primary font-medium">Luz:</span> {plant.light ?? "Sin definir"}
            </p>
            <p className="text-secondary text-sm">
              <span className="text-primary font-medium">Riego:</span>{" "}
              {plant.watering_interval_days
                ? `cada ${plant.watering_interval_days} dias`
                : "Sin intervalo configurado"}
            </p>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricTile
            icon="💧"
            label="Ultimo riego"
            value={lastWater ? formatDateOnly(lastWater.event_at) : "Sin registros"}
            helper={lastWater ? "Basado en timeline" : "Registra el primer riego"}
            variant="default"
          />
          <MetricTile
            icon="📅"
            label="Proximo recomendado"
            value={
              !plant.watering_interval_days
                ? "-"
                : nextRecommendedDate
                  ? formatDateOnly(nextRecommendedDate.toISOString())
                  : "Registra el primer riego"
            }
            helper={
              !plant.watering_interval_days
                ? "Sin intervalo de riego"
                : `Intervalo: ${plant.watering_interval_days} dias`
            }
            variant="default"
          />
          <MetricTile
            icon="🩺"
            label="Estado"
            value={status.label}
            helper={status.helper}
            variant={status.variant}
          />
        </section>

        <Card className="rounded-xl p-4" variant="medium">
          <CardContent className="space-y-5 p-0">
            <h2 className="text-primary text-lg font-semibold">Acciones rapidas</h2>
            <div className="space-y-5 rounded-[var(--radius-3)] border border-white/10 bg-white/5 p-4">
              <h3 className="text-primary text-sm font-medium">Registrar evento</h3>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPE_OPTIONS.map((option) => {
                  const isSelected = selectedEventType === option.type

                  return (
                    <Button
                      key={option.type}
                      type="button"
                      size="sm"
                      variant={isSelected ? "primary" : "ghost"}
                      className="rounded-full"
                      onClick={() => setSelectedEventType(option.type)}
                      disabled={isRegisteringEvent}
                    >
                      {eventIcon(option.type)} {option.label}
                    </Button>
                  )
                })}
              </div>

              <label className="block space-y-1.5">
                <span className="text-secondary text-xs">
                  {selectedEventType === "note" ? "Texto de la nota (opcional)" : "Notas (opcional)"}
                </span>
                <input
                  type="text"
                  value={eventText}
                  onChange={(event) => setEventText(event.target.value)}
                  placeholder={selectedEventType === "note" ? "Ej. Hoja nueva en el brote" : "Ej. Humedad estable"}
                  className="w-full rounded-[var(--radius-2)] border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/45"
                  disabled={isRegisteringEvent}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void onRegisterWater()} disabled={isRegisteringEvent}>
                  {isRegisteringEvent ? "Guardando..." : "Guardar evento"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClearEventComposer}
                  disabled={isRegisteringEvent}
                >
                  Cancelar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button variant="secondary" disabled>
                Añadir nota
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/garden/${plant.id}/photos`}>Subir foto</Link>
              </Button>
              <Button variant="secondary" disabled>
                Preguntar a Toni
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl p-4" variant="strong">
          <CardContent className="space-y-4 p-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-primary text-lg font-semibold">Timeline</h2>
              <p className="text-muted text-xs">{timelineEvents.length} eventos</p>
            </div>

            {timelineEvents.length === 0 ? (
              <GlassSurface className="space-y-2 border border-white/10 bg-white/5 p-4" variant="soft">
                <p className="text-primary font-medium">🌿 Aun no hay eventos registrados</p>
                <p className="text-secondary text-sm">
                  Empieza con un riego para construir el historial de cuidados.
                </p>
              </GlassSurface>
            ) : (
              <ul className="space-y-2">
                {timelineEvents.map((event) => {
                  const detailText = eventDetailText(event.details)

                  return (
                    <li key={event.id} className="rounded-[var(--radius-3)] border border-white/10 bg-white/6 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-primary text-sm font-medium">
                            {eventIcon(event.type)} {eventLabel(event.type)}
                          </p>
                          <p className="text-secondary text-xs">{formatDateTime(event.event_at)}</p>
                          {detailText ? <p className="text-secondary mt-1 text-sm">{detailText}</p> : null}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {snackbar ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 px-2 sm:px-4">
            <GlassSurface
              className="pointer-events-auto mx-auto flex w-full max-w-xl items-center justify-between gap-3 border border-white/15 bg-white/10 px-4 py-3"
              variant="soft"
              role="status"
              aria-live="polite"
            >
              <p className="text-primary text-sm font-medium">{snackbar.message}</p>
              {snackbar.canUndo && lastCreatedEventId ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void onUndoWater()}
                  disabled={isUndoingEvent}
                >
                  {isUndoingEvent ? "Deshaciendo..." : "Deshacer"}
                </Button>
              ) : null}
            </GlassSurface>
          </div>
        ) : null}
      </div>
    </div>
  )
}
