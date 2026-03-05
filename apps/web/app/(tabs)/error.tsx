"use client"

import { useEffect } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"

type TabsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function TabsError({ error, reset }: TabsErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card role="alert" className="border-red-300/45 bg-red-50/70">
      <CardContent className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Ocurrió un problema</h2>
        <p className="text-sm text-neutral-700">
          No pudimos cargar esta sección. Intenta nuevamente.
        </p>
        <Button type="button" variant="danger" onClick={reset}>
          Reintentar
        </Button>
      </CardContent>
    </Card>
  )
}
