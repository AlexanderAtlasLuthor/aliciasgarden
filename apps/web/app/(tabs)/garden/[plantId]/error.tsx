"use client"

import { useEffect } from "react"

import Button from "@/components/ui/Button"
import GlassSurface from "@/components/ui/GlassSurface"

type PlantDetailErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PlantDetailError({ error, reset }: PlantDetailErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <GlassSurface role="alert" className="space-y-3 border-red-300/30 bg-red-500/10 p-4" variant="strong">
      <p className="text-2xl" aria-hidden="true">🌿</p>
      <h2 className="text-lg font-semibold text-white">No pudimos cargar la ficha</h2>
      <p className="text-sm text-white/70">
        Verifica tu conexión e intenta nuevamente en unos segundos.
      </p>
      <Button type="button" variant="primary" onClick={reset}>
        Reintentar
      </Button>
    </GlassSurface>
  )
}
