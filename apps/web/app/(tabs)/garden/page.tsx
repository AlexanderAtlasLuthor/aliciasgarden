import Link from "next/link"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { getPlants, type Plant } from "@/lib/api"
import PlantCard from "./PlantCard"

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
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
