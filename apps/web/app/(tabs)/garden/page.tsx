import Link from "next/link"

import { getPlants, type Plant } from "@/lib/api"

export default async function GardenPage() {
  let plants: Plant[] = []
  let hasError = false

  try {
    plants = await getPlants()
  } catch {
    hasError = true
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Mi Jardín</h1>
        <p className="text-sm text-gray-600">Aquí verás tus plantas guardadas.</p>
      </section>

      <Link
        href="/garden/new"
        className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white"
      >
        Añadir planta
      </Link>

      {hasError ? (
        <section className="bg-white border rounded-2xl shadow-sm p-4">
          <p className="text-sm text-red-700">
            Ups, no pudimos cargar tus plantas. Intenta de nuevo.
          </p>
        </section>
      ) : null}

      {!hasError && plants.length === 0 ? (
        <section className="bg-white border rounded-2xl shadow-sm p-4 space-y-2">
          <p className="font-medium">Aún no tienes plantas 🌿</p>
          <p className="text-sm text-gray-600">
            Crea tu primera planta para empezar a llevar seguimiento.
          </p>
          <Link href="/garden/new" className="text-sm font-medium text-green-700">
            Crear mi primera planta
          </Link>
        </section>
      ) : null}

      {!hasError && plants.length > 0 ? (
        <section className="space-y-3">
          {plants.map((plant) => (
            <article
              key={plant.id}
              className="bg-white border rounded-2xl shadow-sm p-4 space-y-1"
            >
              <p className="font-semibold">{plant.nickname}</p>
              {plant.species_common ? (
                <p className="text-sm text-gray-600">{plant.species_common}</p>
              ) : null}
              {plant.location ? (
                <p className="text-sm text-gray-600">{plant.location}</p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
