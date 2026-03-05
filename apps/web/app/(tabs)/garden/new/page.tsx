"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import Input from "@/components/ui/Input"
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
    <div className="ag-container ag-screen">
      <div className="ag-panel space-y-6">
        <section className="space-y-2">
          <h1 className="text-primary text-2xl font-semibold tracking-tight">Añadir planta</h1>
          <p className="text-secondary text-sm">
            Completa lo básico. Puedes editar más adelante.
          </p>
        </section>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
            {submitError ? (
              <Card
                role="alert"
                className="space-y-2 border-ag-danger bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                <CardContent className="space-y-2 p-0">
                  <p>{submitError}</p>
                  <Button type="submit" disabled={isSubmitting} variant="danger" size="sm">
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <div className="space-y-1">
              <label htmlFor="nickname" className="text-primary text-sm font-medium">
                Nombre (nickname)
              </label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value)
                  if (fieldErrors.nickname) {
                    setFieldErrors((current) => ({ ...current, nickname: undefined }))
                  }
                }}
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
              <label htmlFor="species_common" className="text-primary text-sm font-medium">
                Especie común
              </label>
              <Input
                id="species_common"
                type="text"
                value={speciesCommon}
                onChange={(event) => setSpeciesCommon(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="location" className="text-primary text-sm font-medium">
                Ubicación
              </label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="light" className="text-primary text-sm font-medium">
                Luz
              </label>
              <Input
                id="light"
                type="text"
                value={light}
                onChange={(event) => setLight(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="watering_interval_days"
                className="text-primary text-sm font-medium"
              >
                Intervalo de riego (días)
              </label>
              <Input
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
              <label htmlFor="notes" className="text-primary text-sm font-medium">
                Notas
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="glass-soft text-primary placeholder-hairline w-full rounded-xl px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ag-primary focus-visible:ring-offset-1"
                rows={4}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Guardando..." : "Guardar planta"}
            </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
