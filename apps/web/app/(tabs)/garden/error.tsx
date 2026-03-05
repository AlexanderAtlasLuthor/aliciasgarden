"use client"

import { useEffect } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"

type GardenErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GardenError({ error, reset }: GardenErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card role="alert" className="border-red-300/45 bg-red-50/70">
      <CardContent className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">No pudimos cargar tu jardín</h2>
        <p className="text-sm text-neutral-700">
          Verifica tu conexión e intenta nuevamente en unos segundos.
        </p>
        <Button type="button" variant="danger" onClick={reset}>
          Reintentar
        </Button>
      </CardContent>
    </Card>
  )
}
