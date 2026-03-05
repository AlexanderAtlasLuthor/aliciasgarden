"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { createPlant } from "@/lib/api"

function normalizeOptionalString(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeWateringInterval(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export default function NewPlantPage() {
  const router = useRouter()

  const [nickname, setNickname] = useState("")
  const [speciesCommon, setSpeciesCommon] = useState("")
  const [location, setLocation] = useState("")
  const [light, setLight] = useState("")
  const [wateringIntervalDays, setWateringIntervalDays] = useState("")
  const [notes, setNotes] = useState("")

  const [error, setError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedNickname = nickname.trim()
    if (!trimmedNickname) {
      setError("El nombre (nickname) es requerido.")
      return
    }

    setError("")
    setSubmitError("")
    setIsSubmitting(true)

    try {
      await createPlant({
        nickname: trimmedNickname,
        species_common: normalizeOptionalString(speciesCommon),
        location: normalizeOptionalString(location),
        light: normalizeOptionalString(light),
        watering_interval_days: normalizeWateringInterval(wateringIntervalDays),
        notes: normalizeOptionalString(notes)
      })

      router.push("/garden")
      router.refresh()
    } catch {
      setSubmitError("Ups, no se pudo guardar. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Añadir planta</h1>
        <p className="text-sm text-gray-600">
          Completa lo básico. Puedes editar más adelante.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-2xl shadow-sm p-4 space-y-4"
      >
        {submitError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        ) : null}

        <div className="space-y-1">
          <label htmlFor="nickname" className="text-sm font-medium text-gray-900">
            Nombre (nickname)
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="species_common" className="text-sm font-medium text-gray-900">
            Especie común
          </label>
          <input
            id="species_common"
            type="text"
            value={speciesCommon}
            onChange={(event) => setSpeciesCommon(event.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="location" className="text-sm font-medium text-gray-900">
            Ubicación
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="light" className="text-sm font-medium text-gray-900">
            Luz
          </label>
          <input
            id="light"
            type="text"
            value={light}
            onChange={(event) => setLight(event.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="watering_interval_days"
            className="text-sm font-medium text-gray-900"
          >
            Intervalo de riego (días)
          </label>
          <input
            id="watering_interval_days"
            type="number"
            value={wateringIntervalDays}
            onChange={(event) => setWateringIntervalDays(event.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="notes" className="text-sm font-medium text-gray-900">
            Notas
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            rows={4}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Guardando..." : "Guardar planta"}
        </button>
      </form>
    </div>
  )
}
