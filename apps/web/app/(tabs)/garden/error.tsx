"use client"

import { useEffect } from "react"

type GardenErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GardenError({ error, reset }: GardenErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">No pudimos cargar tu jardín</h2>
      <p className="text-sm text-gray-600">
        Verifica tu conexión e intenta nuevamente en unos segundos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </section>
  )
}
