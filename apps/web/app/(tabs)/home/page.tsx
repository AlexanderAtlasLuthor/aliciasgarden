"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import GlassSurface from "@/components/ui/GlassSurface"
import Input from "@/components/ui/Input"
import MetricTile from "@/components/ui/MetricTile"
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
  const plantsDelta = !isLoading && !error && totalPlants > 0 ? "+" : null
  const locationsDelta = !isLoading && !error && uniqueLocations > 0 ? "✓" : null

  return (
    <div className="space-y-8">
      <section>
        <GlassSurface variant="strong" className="rounded-3xl p-5 md:p-7">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-white/60">Hola 👋</p>
                <h1 className="text-3xl font-semibold text-white">¿Qué haremos hoy?</h1>
                <p className="text-sm text-white/65">Tu resumen del jardín para hoy.</p>
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
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      chip.active
                        ? "border-white/20 bg-white/16 text-white"
                        : "border-white/10 bg-white/6 text-white/70 hover:bg-white/10",
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

      <section className="grid grid-cols-2 gap-3 [&>*]:h-full">
        <MetricTile
          icon="🌿"
          label="Plantas"
          value={
            <span className="inline-flex w-full flex-col gap-2">
              <span className="inline-flex items-end justify-between gap-2">
                <span className="text-2xl font-semibold leading-none">{plantsKpiValue}</span>
                {plantsDelta ? <span className="text-sm text-green-200/90">{plantsDelta}</span> : null}
              </span>
              <span className="h-px w-full bg-white/10" />
              <span className="text-xs text-white/60">Próximo riego: {nextWateringValue}</span>
            </span>
          }
        />
        <MetricTile
          icon="📍"
          label="Ubicaciones"
          value={
            <span className="inline-flex w-full flex-col gap-2">
              <span className="inline-flex items-end justify-between gap-2">
                <span className="text-2xl font-semibold leading-none">{locationKpiValue}</span>
                {locationsDelta ? <span className="text-sm text-green-200/90">{locationsDelta}</span> : null}
              </span>
              <span className="h-px w-full bg-white/10" />
              <span className="text-xs text-white/60">Salud: {healthValue}</span>
            </span>
          }
        />
        <MetricTile icon="✨" label="Última añadida" value={latestKpiValue} />
        <MetricTile icon="✅" label="Estado" value={statusKpiValue} />
      </section>

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

      <section>
        <GlassSurface className="rounded-full border-white/15 px-4 py-2.5" variant="strong">
          <p className="text-sm text-white/80">💡 Insight: Las plantas con luz indirecta crecen más estable.</p>
        </GlassSurface>
      </section>

      <section>
        <GlassSurface className="space-y-4 p-4" variant="strong">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">Acciones rápidas</h2>
            <p className="text-xs text-white/60">Atajos</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="primary"
              size="md"
              className="px-4 py-3 shadow-[0_18px_40px_rgba(88,255,138,0.25)]"
            >
              <Link href="/toni">Hablar con Toni</Link>
            </Button>
            <Button asChild variant="ghost" size="md" className="px-4 py-3 text-ag-text">
              <Link href="/garden/new">Añadir planta</Link>
            </Button>
          </div>
        </GlassSurface>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Mi Jardín</h2>

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
                <p className="font-medium text-white">Aún no tienes plantas 🌿</p>
                <p className="text-sm font-medium text-white">Tu jardín empieza aquí 🌱</p>
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
          <div className="space-y-4">
            {previewPlants.map((plant) => (
              <Card key={plant.id} interactive>
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white/85">
                      {plant.species_common?.slice(0, 2).toUpperCase() || plant.nickname.slice(0, 1).toUpperCase() || "🌿"}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate font-semibold text-white">{plant.nickname}</p>
                      <p className="truncate text-sm text-white/65">
                        {plant.species_common || "Especie sin definir"}
                        {plant.location ? ` • ${plant.location}` : ""}
                      </p>
                    </div>
                    <span aria-hidden="true" className="text-lg text-white/40">
                      ›
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button asChild variant="secondary" size="sm" className="w-fit">
              <Link href="/garden">Ver mi jardín</Link>
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Actividad reciente</h2>

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
  )
}
