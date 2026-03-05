"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import GlassSurface from "@/components/ui/GlassSurface"
import Input from "@/components/ui/Input"
import MiniTimeline from "@/components/ui/MiniTimeline"
import { getPlants, type Plant } from "@/lib/api"

export default function HomePage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlants = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const plantList = await getPlants()
      setPlants(plantList)
    } catch (fetchError: unknown) {
      const fallbackMessage = "No pudimos cargar tu jardin. Intenta de nuevo."

      if (fetchError && typeof fetchError === "object" && "message" in fetchError) {
        const message = (fetchError as { message?: unknown }).message
        if (typeof message === "string" && message.trim()) {
          setError(message)
          return
        }
      }

      setError(fallbackMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPlants()
  }, [])

  const previewPlants = plants.slice(0, 3)
  const totalPlants = plants.length
  const hasMoreThanPreview = plants.length > previewPlants.length
  const greeting = useMemo(() => {
    const hour = new Date().getHours()

    if (hour < 12) {
      return "Buenos dias, Alicia"
    }

    if (hour < 19) {
      return "Buenas tardes, Alicia"
    }

    return "Buenas noches, Alicia"
  }, [])

  const uniqueLocations = useMemo(
    () =>
      new Set(
        plants
          .map((plant) => plant.location?.trim())
          .filter((location): location is string => Boolean(location))
      ).size,
    [plants]
  )

  const latestPlantDisplay = useMemo(
    () => (plants[0]?.nickname ? `@${plants[0].nickname}` : "—"),
    [plants]
  )

  const activityValues = useMemo(() => {
    if (plants.length === 0) {
      return [22, 28, 34, 31, 38, 44, 40]
    }

    return Array.from({ length: 7 }, (_, index) => {
      const seeded = (plants.length * 17 + (index + 1) * 13) % 81
      return 10 + seeded
    })
  }, [plants.length])

  const timelineEvents = useMemo(() => {
    if (plants.length > 0) {
      return [
        { title: `Añadiste ${plants[0].nickname}`, when: "hace 1h" },
        { title: "Actualizaste tu jardín", when: "hoy" },
        { title: "Tip de Toni guardado", when: "ayer" },
      ]
    }

    return [
      { title: "Crea tu primera planta", when: "hoy" },
      { title: "Habla con Toni", when: "hoy" },
    ]
  }, [plants])

  const plantsKpiValue = isLoading || error ? "—" : totalPlants
  const locationKpiValue = isLoading || error || uniqueLocations === 0 ? "—" : uniqueLocations
  const latestKpiValue = isLoading || error ? "—" : latestPlantDisplay
  const statusKpiValue = error ? "Error" : isLoading ? "—" : totalPlants > 0 ? "Conectado" : "Sin datos"
  const nextWateringValue = isLoading || error ? "—" : totalPlants === 0 ? "—" : totalPlants % 2 === 0 ? "Hoy" : "2d"
  const healthValue = isLoading || error ? "—" : "OK"
  const statusHelper = error ? "Revisa tu conexión" : "Sincronización activa"
  const dashboardTiles = [
    {
      icon: "🌿",
      label: "Plantas",
      value: String(plantsKpiValue),
      helper: `Próximo riego: ${nextWateringValue}`,
    },
    {
      icon: "📍",
      label: "Ubicaciones",
      value: String(locationKpiValue),
      helper: `Salud: ${healthValue}`,
    },
    {
      icon: "✨",
      label: "Última añadida",
      value: String(latestKpiValue),
      helper: "Esta semana",
    },
    {
      icon: "✅",
      label: "Estado",
      value: String(statusKpiValue),
      helper: statusHelper,
    },
  ]
  const weeklyTimeline = useMemo(() => {
    if (plants.length === 0) {
      return [
        { label: "L", intensity: 20, kind: "water" as const },
        { label: "M", intensity: 24, kind: "water" as const },
        { label: "X", intensity: 30, kind: "water" as const },
        { label: "J", intensity: 22, kind: "water" as const },
        { label: "V", intensity: 35, kind: "water" as const },
        { label: "S", intensity: 18, kind: "water" as const },
        { label: "D", intensity: 26, kind: "water" as const },
      ]
    }

    return [
      { label: "L", intensity: 34, kind: "water" as const },
      { label: "M", intensity: 42, kind: "water" as const },
      { label: "X", intensity: 58, kind: "water" as const },
      { label: "J", intensity: 38, kind: "water" as const },
      { label: "V", intensity: 68, kind: "water" as const },
      { label: "S", intensity: 28, kind: "water" as const },
      { label: "D", intensity: 46, kind: "water" as const },
    ]
  }, [plants.length])

  return (
    <div className="ag-container ag-screen">
      <div className="ag-panel">
        <section>
          <GlassSurface variant="strong" className="rounded-3xl p-5 md:p-7">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted">{greeting}</p>
                  <h1 className="text-primary text-3xl font-semibold tracking-tight">¿Qué haremos hoy?</h1>
                  <p className="text-secondary mt-1 text-sm">Tu resumen del jardín para hoy.</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  Dashboard
                </span>
              </div>

              <div className="space-y-3">
                <Input placeholder="Buscar plantas…" aria-label="Buscar plantas" />
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Todas", active: true },
                    { label: "Interior", active: false },
                    { label: "Exterior", active: false },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      className={[
                        "glass-soft rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        chip.active
                          ? "border-white/20 bg-white/16 text-white"
                          : "text-white/70 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassSurface>
        </section>

        <div className="ag-divider ag-section" />

        <section className="ag-section grid grid-cols-2 gap-3 md:grid-cols-4">
          {dashboardTiles.map((tile) => {
            const isLongValueTile = tile.label === "Última añadida"

            return (
              <Card key={tile.label} variant="medium" className="rounded-2xl">
                <CardContent className="min-w-0 space-y-3 p-4">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] backdrop-blur-md">
                    <span className="text-base leading-none">{tile.icon}</span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p
                      className={[
                        "min-w-0 font-semibold tracking-tight text-text-primary",
                        isLongValueTile
                          ? "text-ag-h3 leading-tight break-words"
                          : "text-ag-h2 leading-none",
                      ].join(" ")}
                    >
                      {tile.value}
                    </p>
                    <p className="text-ag-h3 text-text-muted">{tile.label}</p>
                  </div>

                  <p className="ag-truncate text-ag-caption text-text-muted">{tile.helper}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <div className="ag-divider ag-section" />

        <div className="ag-section grid gap-4 md:grid-cols-2 md:items-start">
          <div className="space-y-4">
            <section>
              <MiniTimeline
                title="Semana de cuidados"
                subtitle="Vista rápida"
                items={weeklyTimeline}
                ctaLabel="Ver plan"
                ctaHref="/plan"
              />
            </section>

            <section>
              <GlassSurface className="space-y-4 p-4" variant="medium">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-primary text-lg font-medium">Acciones rápidas</h2>
                  <p className="text-muted text-xs">Atajos</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    asChild
                    variant="primary"
                    size="md"
                    className="h-12 w-full px-4 py-3 shadow-[0_18px_40px_rgba(88,255,138,0.25)]"
                  >
                    <Link href="/toni">Hablar con Toni</Link>
                  </Button>
                  <Button asChild variant="ghost" size="md" className="h-12 w-full px-4 py-3">
                    <Link href="/garden/new">Añadir planta</Link>
                  </Button>
                </div>
              </GlassSurface>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-primary text-lg font-medium">Mi Jardín</h2>
                {hasMoreThanPreview ? (
                  <Link href="/garden" className="text-secondary text-sm transition-colors hover:text-primary">
                    Ver mi jardín
                  </Link>
                ) : null}
              </div>

          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-live="polite">
              <GlassSurface className="h-24 animate-pulse border-white/15 bg-gradient-to-r from-white/10 to-emerald-200/10" />
              <GlassSurface className="h-24 animate-pulse border-white/15 bg-gradient-to-r from-white/10 to-cyan-200/10" />
              <GlassSurface className="h-24 animate-pulse border-white/15 bg-gradient-to-r from-white/10 to-emerald-100/10" />
            </div>
          ) : null}

          {!isLoading && error ? (
            <GlassSurface
              role="alert"
              className="space-y-3 rounded-2xl border-red-300/35 bg-red-500/10 p-4 text-red-100"
              variant="strong"
            >
              <p className="text-sm">{error}</p>
              <button
                type="button"
                onClick={() => {
                  void loadPlants()
                }}
                className="inline-flex items-center justify-center rounded-lg border border-red-200/40 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-100"
              >
                Reintentar
              </button>
            </GlassSurface>
          ) : null}

          {!isLoading && !error && plants.length === 0 ? (
            <GlassSurface variant="strong" className="rounded-2xl p-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="font-medium text-white">🌱 Aún no tienes plantas</p>
                  <p className="font-medium text-white">Aún no tienes plantas 🌿</p>
                  <p className="text-sm font-medium text-white">Añade tu primera planta para empezar</p>
                  <p className="text-sm text-white/70">
                    Crea tu primera planta para empezar a llevar seguimiento.
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm" className="w-fit">
                  <Link href="/garden/new">Añadir planta</Link>
                </Button>
              </div>
            </GlassSurface>
          ) : null}

          {!isLoading && !error && plants.length > 0 ? (
            <div className="space-y-2">
              {previewPlants.map((plant) => (
                <Card
                  key={plant.id}
                  interactive
                  variant="medium"
                  className="rounded-xl p-3 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl"
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-medium text-white/85">
                        {plant.nickname.slice(0, 1).toUpperCase() || "🌿"}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="text-primary truncate font-medium">{plant.nickname}</p>
                        {(plant.species_common || plant.location) && (
                          <p className="text-secondary truncate text-sm">
                            {[plant.species_common, plant.location].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span aria-hidden="true" className="text-muted text-lg">
                        ›
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
            </section>
          </div>

          <div className="space-y-4">
            <section>
              <GlassSurface className="space-y-4 p-4" variant="strong">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">Actividad</p>
                    <p className="text-xs text-white/60">Últimos 7 días</p>
                  </div>
                  <p className="text-sm font-semibold text-white/85">+12%</p>
                </div>
                {isLoading ? (
                  <div className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/5" />
                ) : (
                  <div className="flex h-24 items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    {activityValues.map((value, index) => (
                      <div
                        key={`bar-${index}`}
                        className={[
                          "w-full rounded-t-sm border border-white/10 transition-all",
                          index === activityValues.length - 1 ? "bg-white/22" : "bg-white/14",
                        ].join(" ")}
                        style={{ height: `${value}%` }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}
              </GlassSurface>
            </section>

            <section className="space-y-4">
              <h2 className="text-primary text-lg font-medium">Actividad reciente</h2>

              {isLoading ? (
                <GlassSurface className="h-28 animate-pulse border-white/15 bg-white/6" variant="strong" />
              ) : (
                <GlassSurface className="relative space-y-3 p-4" variant="strong">
                  <div className="pointer-events-none absolute bottom-6 left-5 top-6 w-px bg-white/10" />
                  {timelineEvents.map((event, index) => (
                    <div key={`${event.title}-${index}`} className="relative pl-7">
                      <span
                        className={[
                          "absolute left-[13px] top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white/20",
                          index === 0 ? "bg-emerald-300/70 shadow-[0_0_10px_rgba(120,255,190,0.5)]" : "bg-white/40",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                      <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-2">
                        <p className="text-sm font-medium text-white/90">{event.title}</p>
                        <p className="text-xs text-white/60">{event.when}</p>
                      </div>
                    </div>
                  ))}
                </GlassSurface>
              )}
            </section>

            <section>
              <GlassSurface className="rounded-full border-white/15 px-4 py-2.5" variant="strong">
                <p className="text-sm text-white/80">💡 Insight: Las plantas con luz indirecta crecen más estable.</p>
              </GlassSurface>
            </section>

            <section>
              <GlassSurface className="rounded-2xl border-white/15 p-4" variant="strong">
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none">💡</span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Tip de Toni</p>
                    <p className="text-sm text-white/70">
                      Tip: Si las hojas amarillean, revisa riego y drenaje.
                    </p>
                  </div>
                </div>
              </GlassSurface>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
