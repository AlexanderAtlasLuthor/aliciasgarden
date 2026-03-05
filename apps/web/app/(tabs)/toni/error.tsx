"use client"

import { useEffect } from "react"

import Button from "@/components/ui/Button"
import GlassSurface from "@/components/ui/GlassSurface"

type ToniErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ToniError({ error, reset }: ToniErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <GlassSurface role="alert" className="space-y-3 border-red-300/30 bg-red-500/10 p-4" variant="strong">
      <p className="text-2xl" aria-hidden="true">🤖</p>
      <h2 className="text-lg font-semibold text-white">Toni no está disponible</h2>
      <p className="text-sm text-white/70">
          Ocurrió un error al abrir el chat. Intenta nuevamente.
      </p>
      <Button type="button" variant="primary" onClick={reset}>
        Reintentar
      </Button>
    </GlassSurface>
  )
}
