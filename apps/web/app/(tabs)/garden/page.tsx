import Link from "next/link"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { getPlants, type Plant } from "@/lib/api"
import GardenClient from "./GardenClient"

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
        <section className="relative overflow-hidden rounded-[calc(var(--radius-4)+2px)] border border-white/12 bg-[linear-gradient(135deg,rgba(88,255,138,0.17),rgba(54,180,133,0.08)_38%,rgba(7,31,22,0.45)_100%)] px-5 py-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(88,255,138,0.42),rgba(88,255,138,0))] blur-xl" />
          <div className="pointer-events-none absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(166,255,221,0.24),rgba(166,255,221,0))] blur-lg" />

          <div className="relative space-y-2">
            <h1 className="text-primary text-2xl font-semibold tracking-tight">Mi Jardín</h1>
            <p className="text-secondary text-sm">Aquí verás tus plantas guardadas.</p>
          </div>
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
          <GardenClient plants={plants} />
        ) : null}
      </div>
    </div>
  )
}
