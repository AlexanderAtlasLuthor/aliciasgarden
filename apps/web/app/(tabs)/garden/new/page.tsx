"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { createPlant } from "@/lib/api"

function normalizeOptionalString(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

type PlantFormInput = {
  nickname: string
  wateringIntervalDays: string
}

type PlantFormErrors = {
  nickname?: string
  wateringIntervalDays?: string
}

type PlantFormValidationResult = {
  errors: PlantFormErrors
  values: {
    nickname: string
    watering_interval_days?: number
  }
}

function validatePlantForm(input: PlantFormInput): PlantFormValidationResult {
  const errors: PlantFormErrors = {}

  const trimmedNickname = input.nickname.trim()
  if (!trimmedNickname) {
    errors.nickname = "El nombre (nickname) es obligatorio."
  } else if (trimmedNickname.length < 2 || trimmedNickname.length > 40) {
    errors.nickname = "El nombre debe tener entre 2 y 40 caracteres."
  }

  const trimmedWateringInterval = input.wateringIntervalDays.trim()
  let wateringIntervalDays: number | undefined

  if (trimmedWateringInterval) {
    const isInteger = /^\d+$/.test(trimmedWateringInterval)
    const parsed = Number(trimmedWateringInterval)

    if (!isInteger || !Number.isInteger(parsed)) {
      errors.wateringIntervalDays = "El intervalo de riego debe ser un numero entero."
    } else if (parsed < 1 || parsed > 365) {
      errors.wateringIntervalDays = "El intervalo de riego debe estar entre 1 y 365 dias."
    } else {
      wateringIntervalDays = parsed
    }
  }

  return {
    errors,
    values: {
      nickname: trimmedNickname,
      watering_interval_days: wateringIntervalDays
    }
  }
}

export default function NewPlantPage() {
  const router = useRouter()

  const [nickname, setNickname] = useState("")
  const [speciesCommon, setSpeciesCommon] = useState("")
  const [location, setLocation] = useState("")
  const [light, setLight] = useState("")
  const [wateringIntervalDays, setWateringIntervalDays] = useState("")
  const [notes, setNotes] = useState("")

  const [fieldErrors, setFieldErrors] = useState<PlantFormErrors>({})
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validation = validatePlantForm({
      nickname,
      wateringIntervalDays
    })

    if (Object.keys(validation.errors).length > 0) {
      setFieldErrors(validation.errors)
      return
    }

    setFieldErrors({})
    setSubmitError("")
    setIsSubmitting(true)

    try {
      await createPlant({
        nickname: validation.values.nickname,
        species_common: normalizeOptionalString(speciesCommon),
        location: normalizeOptionalString(location),
        light: normalizeOptionalString(light),
        watering_interval_days: validation.values.watering_interval_days,
        notes: normalizeOptionalString(notes)
      })

      router.push("/garden")
      router.refresh()
    } catch (error: unknown) {
      const fallbackMessage = "Ups, no se pudo guardar. Intenta de nuevo."

      if (error && typeof error === "object" && "message" in error) {
        const message = (error as { message?: unknown }).message
        if (typeof message === "string" && message.trim()) {
          setSubmitError(message)
          return
        }
      }

      setSubmitError(fallbackMessage)
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
        aria-live="polite"
      >
        {submitError ? (
          <div
            role="alert"
            className="space-y-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <p>{submitError}</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-60"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        <div className="space-y-1">
          <label htmlFor="nickname" className="text-sm font-medium text-gray-900">
            Nombre (nickname)
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value)
              if (fieldErrors.nickname) {
                setFieldErrors((current) => ({ ...current, nickname: undefined }))
              }
            }}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            aria-invalid={Boolean(fieldErrors.nickname)}
            aria-describedby={fieldErrors.nickname ? "nickname-error" : undefined}
            required
          />
          {fieldErrors.nickname ? (
            <p id="nickname-error" role="alert" className="text-sm text-red-600">
              {fieldErrors.nickname}
            </p>
          ) : null}
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
            onChange={(event) => {
              setWateringIntervalDays(event.target.value)
              if (fieldErrors.wateringIntervalDays) {
                setFieldErrors((current) => ({
                  ...current,
                  wateringIntervalDays: undefined
                }))
              }
            }}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            min={1}
            max={365}
            step={1}
            aria-invalid={Boolean(fieldErrors.wateringIntervalDays)}
            aria-describedby={
              fieldErrors.wateringIntervalDays ? "watering-interval-days-error" : undefined
            }
          />
          {fieldErrors.wateringIntervalDays ? (
            <p
              id="watering-interval-days-error"
              role="alert"
              className="text-sm text-red-600"
            >
              {fieldErrors.wateringIntervalDays}
            </p>
          ) : null}
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
