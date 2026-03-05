"use client"

import { useEffect } from "react"

type TabsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function TabsError({ error, reset }: TabsErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Ocurrió un problema</h2>
      <p className="text-sm text-gray-600">
        No pudimos cargar esta sección. Intenta nuevamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </div>
  )
}
