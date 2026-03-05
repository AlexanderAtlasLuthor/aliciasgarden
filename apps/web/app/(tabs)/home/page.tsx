"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import MetricTile from "@/components/ui/MetricTile"
import { getPlants, type Plant } from "@/lib/api"

export default function HomePage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlants = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const plantList = await getPlants()
      setPlants(plantList)
    } catch (fetchError: unknown) {
      const fallbackMessage = "No pudimos cargar tu jardin. Intenta de nuevo."

      if (fetchError && typeof fetchError === "object" && "message" in fetchError) {
        const message = (fetchError as { message?: unknown }).message
        if (typeof message === "string" && message.trim()) {
          setError(message)
          return
        }
      }

      setError(fallbackMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPlants()
  }, [])

  const previewPlants = plants.slice(0, 3)
  const totalPlants = plants.length

  const locationCounts = plants.reduce<Record<string, number>>((accumulator, plant) => {
    const location = plant.location?.trim()

    if (!location) {
      return accumulator
    }

    accumulator[location] = (accumulator[location] ?? 0) + 1
    return accumulator
  }, {})

  const favoriteLocation =
    Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sin datos"

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <p className="text-sm text-white/60">Hola 👋</p>
        <h1 className="text-3xl font-semibold text-white">¿Qué haremos hoy?</h1>
      </section>

      <section className="flex gap-3">
        <Button
          asChild
          variant="primary"
          size="md"
          className="px-4 py-3 shadow-[0_18px_40px_rgba(88,255,138,0.25)]"
        >
          <Link href="/toni">Hablar con Toni</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="md"
          className="px-4 py-3 text-ag-text"
        >
          <Link href="/garden/new">Añadir planta</Link>
        </Button>
      </section>

      <section className="grid grid-cols-2 gap-3 [&>*]:h-full">
        <MetricTile icon="🌱" label="Plantas" value={totalPlants} />
        <MetricTile icon="💧" label="Riegos hoy" value={2} />
        <MetricTile icon="📍" label="Ubicación favorita" value={favoriteLocation} />
        <MetricTile icon="🔥" label="Streak" value="5 días" />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Mi Jardín</h2>

        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <div
            role="alert"
            className="space-y-2 rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-red-100 shadow-lg"
          >
            <p className="text-sm">{error}</p>
            <button
              type="button"
              onClick={() => {
                void loadPlants()
              }}
              className="inline-flex items-center justify-center rounded-lg border border-red-200/40 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-100"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error && plants.length === 0 ? (
          <Card>
            <CardContent className="space-y-2">
              <p className="font-medium text-white">Aún no tienes plantas 🌿</p>
              <p className="text-sm text-white/70">
              Crea tu primera planta para empezar a llevar seguimiento.
              </p>
              <Link href="/garden/new" className="text-sm font-medium text-green-300">
                Crear mi primera planta
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !error && plants.length > 0 ? (
          <div className="space-y-4">
            {previewPlants.map((plant) => (
              <Card key={plant.id} interactive>
                <CardContent className="space-y-1">
                  <p className="font-semibold text-white">{plant.nickname}</p>
                  {plant.species_common ? (
                    <p className="text-sm text-white/70">{plant.species_common}</p>
                  ) : null}
                  {plant.location ? (
                    <p className="text-sm text-white/70">{plant.location}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}

            <Link
              href="/garden"
              className="text-sm font-medium text-green-300 underline decoration-green-300/35 underline-offset-4 transition-all duration-200 hover:text-green-200 hover:drop-shadow-[0_0_12px_rgba(120,255,180,0.45)]"
            >
              Ver mi jardín
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  )
}
