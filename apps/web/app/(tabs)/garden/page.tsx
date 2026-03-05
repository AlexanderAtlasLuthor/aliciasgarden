import Link from "next/link"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { getPlants, type Plant } from "@/lib/api"

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
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Mi Jardín</h1>
        <p className="text-sm text-gray-600">Aquí verás tus plantas guardadas.</p>
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
          <CardContent className="space-y-2">
            <p className="font-medium">Aún no tienes plantas 🌿</p>
            <p className="text-sm text-gray-600">
              Crea tu primera planta para empezar a llevar seguimiento.
            </p>
            <Link href="/garden/new" className="text-sm font-medium text-green-700">
              Crear mi primera planta
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {!hasError && plants.length > 0 ? (
        <section className="space-y-3">
          {plants.map((plant) => (
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
        </section>
      ) : null}
    </div>
  )
}
