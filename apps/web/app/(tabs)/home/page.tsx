import Link from "next/link"

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Hola 👋 ¿Qué haremos hoy?</h1>
        <p className="text-sm text-gray-600">Elige una acción rápida para empezar.</p>
      </section>

      <section className="flex gap-3">
        <Link
          href="/toni"
          className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium bg-green-600 text-white"
        >
          Hablar con Toni
        </Link>
        <Link
          href="/garden/new"
          className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium bg-white border text-gray-900"
        >
          Añadir planta
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Mi Jardín</h2>
        <div className="bg-white border rounded-2xl shadow-sm p-4 space-y-2">
          <p className="font-medium">Aún no tienes plantas 🌿</p>
          <p className="text-sm text-gray-600">
            Crea tu primera planta para empezar a llevar seguimiento.
          </p>
          <Link href="/garden/new" className="text-sm font-medium text-green-700">
            Crear mi primera planta
          </Link>
        </div>
      </section>
    </div>
  )
}
