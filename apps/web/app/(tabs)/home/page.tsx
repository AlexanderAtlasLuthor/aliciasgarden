"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
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

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Hola 👋 ¿Qué haremos hoy?</h1>
        <p className="text-sm text-gray-600">Elige una acción rápida para empezar.</p>
      </section>

      <section className="flex gap-3">
        <Button
          asChild
          variant="primary"
          size="md"
          className="px-4 py-3"
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Mi Jardín</h2>

        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <div className="h-20 animate-pulse rounded-2xl border bg-white" />
            <div className="h-20 animate-pulse rounded-2xl border bg-white" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <div
            role="alert"
            className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm"
          >
            <p className="text-sm">{error}</p>
            <button
              type="button"
              onClick={() => {
                void loadPlants()
              }}
              className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error && plants.length === 0 ? (
          <div className="bg-white border rounded-2xl shadow-sm p-4 space-y-2">
            <p className="font-medium">Aún no tienes plantas 🌿</p>
            <p className="text-sm text-gray-600">
              Crea tu primera planta para empezar a llevar seguimiento.
            </p>
            <Link href="/garden/new" className="text-sm font-medium text-green-700">
              Crear mi primera planta
            </Link>
          </div>
        ) : null}

        {!isLoading && !error && plants.length > 0 ? (
          <div className="space-y-3">
            {previewPlants.map((plant) => (
              <Card key={plant.id}>
                <CardContent className="space-y-1">
                  <p className="font-semibold">{plant.nickname}</p>
                  {plant.species_common ? (
                    <p className="text-sm text-gray-600">{plant.species_common}</p>
                  ) : null}
                  {plant.location ? (
                    <p className="text-sm text-gray-600">{plant.location}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}

            <Link href="/garden" className="text-sm font-medium text-green-700">
              Ver mi jardín
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  )
}
