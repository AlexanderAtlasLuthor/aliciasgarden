import Link from "next/link"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { getPlants, type Plant } from "@/lib/api"

export const runtime = "edge"

export default async function GardenPage() {
  let plants: Plant[] = []
  let hasError = false
  let errorMessage = "Ups, no pudimos cargar tus plantas. Intenta de nuevo."

  try {
    plants = await getPlants()
  } catch (error: unknown) {
    hasError = true

    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message
      if (typeof message === "string" && message.trim()) {
        errorMessage = message
      }
    }
  }

  return (
    <div className="ag-container ag-screen">
      <div className="ag-panel space-y-6">
        <section className="space-y-2">
          <h1 className="text-primary text-2xl font-semibold tracking-tight">Mi Jardín</h1>
          <p className="text-secondary text-sm">Aquí verás tus plantas guardadas.</p>
        </section>

        <Button asChild className="w-full">
          <Link href="/garden/new">Añadir planta</Link>
        </Button>

        {hasError ? (
          <Card>
            <CardContent>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : null}

        {!hasError && plants.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-3">
              <p className="text-primary font-medium">🌱 Aún no tienes plantas</p>
              <p className="text-secondary text-sm">Añade tu primera planta para empezar</p>
              <Button asChild variant="secondary" size="sm" className="w-fit">
                <Link href="/garden/new">Añadir planta</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!hasError && plants.length > 0 ? (
          <section className="space-y-2">
            {plants.map((plant) => (
              <Card
                key={plant.id}
                interactive
                className="rounded-xl p-3 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl"
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-medium">
                      {plant.nickname.slice(0, 1).toUpperCase() || "🌿"}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="text-primary truncate font-medium">{plant.nickname}</p>
                      {(plant.species_common || plant.location) && (
                        <p className="text-secondary truncate text-sm">
                          {[plant.species_common, plant.location].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span aria-hidden="true" className="text-muted text-lg">
                      ›
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
