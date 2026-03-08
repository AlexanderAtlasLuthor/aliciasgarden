"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import GlassSurface from "@/components/ui/GlassSurface"
import MetricTile from "@/components/ui/MetricTile"
import {
  createPlantMeasurement,
  createPlantEvent,
  deletePlant,
  deletePlantEvent,
  getPlantById,
  getPlantEvents,
  isAPIError,
  patchPlant,
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
  const router = useRouter()
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
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isDeletingPlant, setIsDeletingPlant] = useState(false)
  const [deletePlantError, setDeletePlantError] = useState<string | null>(null)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [measurementHeight, setMeasurementHeight] = useState("")
  const [measurementLeaves, setMeasurementLeaves] = useState("")
  const [measurementNote, setMeasurementNote] = useState("")
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false)
  const [measurementError, setMeasurementError] = useState<string | null>(null)
  const [measurementSuccess, setMeasurementSuccess] = useState<string | null>(null)
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

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

  const onToggleFavorite = useCallback(async () => {
    if (!plant || isTogglingFavorite) return
    setIsTogglingFavorite(true)
    try {
      const updated = await patchPlant(plantId, { is_favorite: !plant.is_favorite })
      setPlant(updated)
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        showSnackbar(error.message, false, 5_000)
      } else {
        showSnackbar("No se pudo actualizar favorito.", false, 5_000)
      }
    } finally {
      setIsTogglingFavorite(false)
    }
  }, [isTogglingFavorite, plant, plantId, showSnackbar])

  const onStartEditing = useCallback(() => {
    if (!plant) return
    setNameDraft(plant.nickname)
    setNameError(null)
    setIsEditingName(true)
    requestAnimationFrame(() => nameInputRef.current?.focus())
  }, [plant])

  const onCancelEditing = useCallback(() => {
    setIsEditingName(false)
    setNameError(null)
    if (plant) setNameDraft(plant.nickname)
  }, [plant])

  const onSaveName = useCallback(async () => {
    if (isSavingName || !plant) return
    const trimmed = nameDraft.trim()
    if (trimmed.length < 2 || trimmed.length > 40) {
      setNameError("El nombre debe tener entre 2 y 40 caracteres.")
      return
    }
    setIsSavingName(true)
    setNameError(null)
    try {
      const updated = await patchPlant(plantId, { nickname: trimmed })
      setPlant(updated)
      setIsEditingName(false)
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        setNameError(error.message)
      } else {
        setNameError("No se pudo actualizar el nombre.")
      }
    } finally {
      setIsSavingName(false)
    }
  }, [isSavingName, nameDraft, plant, plantId])

  const onDeletePlant = useCallback(async () => {
    if (isDeletingPlant || !plantId) return
    if (!confirm("¿Eliminar esta planta? Se borrarán también fotos y eventos. Esto no se puede deshacer.")) return
    setDeletePlantError(null)
    setIsDeletingPlant(true)
    try {
      await deletePlant(plantId)
      router.push("/garden")
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        setDeletePlantError(error.message)
      } else {
        setDeletePlantError("No se pudo eliminar la planta.")
      }
    } finally {
      setIsDeletingPlant(false)
    }
  }, [isDeletingPlant, plantId, router])

  const onSaveMeasurement = useCallback(async () => {
    if (!plant || isSavingMeasurement) {
      return
    }

    const trimmedHeight = measurementHeight.trim()
    const trimmedLeaves = measurementLeaves.trim()
    const trimmedNote = measurementNote.trim()

    if (!trimmedHeight && !trimmedLeaves && !trimmedNote) {
      setMeasurementSuccess(null)
      setMeasurementError("Ingresa al menos altura, hojas o una nota.")
      return
    }

    const payload: {
      height_cm?: number
      leaf_count?: number
      notes?: string
    } = {}

    if (trimmedHeight) {
      const parsedHeight = Number(trimmedHeight)
      if (!Number.isFinite(parsedHeight)) {
        setMeasurementSuccess(null)
        setMeasurementError("La altura debe ser un numero valido.")
        return
      }
      payload.height_cm = parsedHeight
    }

    if (trimmedLeaves) {
      const parsedLeaves = Number(trimmedLeaves)
      if (!Number.isInteger(parsedLeaves)) {
        setMeasurementSuccess(null)
        setMeasurementError("La cantidad de hojas debe ser un entero.")
        return
      }
      payload.leaf_count = parsedLeaves
    }

    if (trimmedNote) {
      payload.notes = trimmedNote
    }

    setIsSavingMeasurement(true)
    setMeasurementError(null)
    setMeasurementSuccess(null)

    try {
      await createPlantMeasurement(plant.id, payload)
      setMeasurementHeight("")
      setMeasurementLeaves("")
      setMeasurementNote("")
      setMeasurementSuccess("Medicion guardada.")
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        setMeasurementError(error.message)
      } else {
        setMeasurementError("No se pudo guardar la medicion.")
      }
    } finally {
      setIsSavingMeasurement(false)
    }
  }, [
    isSavingMeasurement,
    measurementHeight,
    measurementLeaves,
    measurementNote,
    plant,
  ])

  const onNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        void onSaveName()
      } else if (e.key === "Escape") {
        e.preventDefault()
        onCancelEditing()
      }
    },
    [onSaveName, onCancelEditing]
  )

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

          {isEditingName ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={onNameKeyDown}
                  disabled={isSavingName}
                  maxLength={40}
                  aria-label="Nombre de la planta"
                  className="min-w-0 flex-1 rounded-[var(--radius-2)] border border-white/15 bg-white/10 px-3 py-1.5 text-xl font-semibold text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:opacity-50"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => void onSaveName()}
                  disabled={isSavingName}
                >
                  {isSavingName ? "Guardando..." : "Guardar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelEditing}
                  disabled={isSavingName}
                >
                  Cancelar
                </Button>
              </div>
              {nameError ? (
                <p className="text-sm text-red-400" role="alert">{nameError}</p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-primary text-2xl font-semibold tracking-tight">{plant.nickname}</h1>
              <button
                type="button"
                onClick={() => void onToggleFavorite()}
                disabled={isTogglingFavorite}
                aria-label={plant.is_favorite ? "Quitar de favoritos" : "Marcar como favorita"}
                className="text-xl leading-none transition-opacity disabled:opacity-50"
              >
                {plant.is_favorite ? "★" : "☆"}
              </button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onStartEditing}
                aria-label="Editar nombre de la planta"
              >
                Editar
              </Button>
            </div>
          )}

          <p className="text-secondary text-sm">{plant.species_common ?? "Ficha de planta"}</p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
              disabled={isDeletingPlant}
              onClick={() => void onDeletePlant()}
            >
              {isDeletingPlant ? "Eliminando..." : "Eliminar planta"}
            </Button>
          </div>
          {deletePlantError ? (
            <p className="text-sm text-red-400" role="alert">{deletePlantError}</p>
          ) : null}
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
              <Button asChild variant="secondary">
                <Link href={`/garden/${plant.id}/diagnose`}>Diagnostico por foto</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/garden/${plant.id}/toni`}>Preguntar a Toni</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl p-4" variant="medium">
          <CardContent className="space-y-4 p-0">
            <h2 className="text-primary text-lg font-semibold">Crecimiento</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-secondary text-xs">Altura (cm)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  value={measurementHeight}
                  onChange={(event) => setMeasurementHeight(event.target.value)}
                  placeholder="Ej. 42"
                  disabled={isSavingMeasurement}
                  className="w-full rounded-[var(--radius-2)] border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/45"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-secondary text-xs">Hojas</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={measurementLeaves}
                  onChange={(event) => setMeasurementLeaves(event.target.value)}
                  placeholder="Ej. 7"
                  disabled={isSavingMeasurement}
                  className="w-full rounded-[var(--radius-2)] border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/45"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-secondary text-xs">Nota</span>
              <textarea
                value={measurementNote}
                onChange={(event) => setMeasurementNote(event.target.value)}
                placeholder="Ej. Nueva hoja en el brote lateral"
                rows={3}
                disabled={isSavingMeasurement}
                className="w-full rounded-[var(--radius-2)] border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/45"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => void onSaveMeasurement()}
                disabled={isSavingMeasurement}
              >
                {isSavingMeasurement ? "Guardando..." : "Guardar medicion"}
              </Button>

              {measurementSuccess ? (
                <p className="text-sm text-green-300" role="status">
                  {measurementSuccess}
                </p>
              ) : null}

              {measurementError ? (
                <p className="text-sm text-red-400" role="alert">
                  {measurementError}
                </p>
              ) : null}
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
