"use client"

import { useEffect } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"

type ToniErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ToniError({ error, reset }: ToniErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card role="alert" className="border-red-300/45 bg-red-50/70">
      <CardContent className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Toni no está disponible</h2>
        <p className="text-sm text-neutral-700">
          Ocurrió un error al abrir el chat. Intenta nuevamente.
        </p>
        <Button type="button" variant="danger" onClick={reset}>
          Reintentar
        </Button>
      </CardContent>
    </Card>
  )
}
