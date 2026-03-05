"use client"

import { useEffect } from "react"

import Button from "@/components/ui/Button"
import GlassSurface from "@/components/ui/GlassSurface"

type TabsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function TabsError({ error, reset }: TabsErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <GlassSurface role="alert" className="space-y-4 border-red-300/30 bg-red-500/10 p-4" variant="strong">
      <p className="text-2xl" aria-hidden="true">⚠️</p>
      <h2 className="text-lg font-semibold text-white">Ocurrió un problema</h2>
      <p className="text-sm text-white/70">
          No pudimos cargar esta sección. Intenta nuevamente.
      </p>
      <Button type="button" variant="primary" onClick={reset}>
        Reintentar
      </Button>
    </GlassSurface>
  )
}
