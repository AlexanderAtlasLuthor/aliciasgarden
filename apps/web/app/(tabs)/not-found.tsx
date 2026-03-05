import Link from "next/link"

export default function TabsNotFound() {
  return (
    <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">No encontramos esta pantalla</h2>
      <p className="text-sm text-gray-600">
        La ruta que buscabas no existe o fue movida.
      </p>
      <Link
        href="/home"
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
      >
        Volver al inicio
      </Link>
    </section>
  )
}
