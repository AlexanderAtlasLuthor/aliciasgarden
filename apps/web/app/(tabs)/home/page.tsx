"use client"

import { useEffect, useMemo, useState } from "react"

import ActivityChart from "@/components/dashboard/ActivityChart"
import DashboardHero from "@/components/dashboard/DashboardHero"
import DashboardStats from "@/components/dashboard/DashboardStats"
import GardenHighlights from "@/components/dashboard/GardenHighlights"
import QuickActions from "@/components/dashboard/QuickActions"
import RecentActivity from "@/components/dashboard/RecentActivity"
import WeatherCard from "@/components/dashboard/WeatherCard"
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

  const totalPlants = plants.length

  const favoritesCount = useMemo(
    () => plants.filter((p) => p.is_favorite).length,
    [plants]
  )

  const outdoorCount = useMemo(
    () =>
      plants.filter((p) => {
        const loc = p.location?.toLowerCase() ?? ""
        return loc.includes("exterior") || loc.includes("jardín") || loc.includes("balcón") || loc.includes("terraza") || loc.includes("patio")
      }).length,
    [plants]
  )

  const riegosEstaSemana = useMemo(() => {
    if (plants.length === 0) return 0
    return plants.reduce((sum, p) => {
      const interval = p.watering_interval_days ?? 7
      return sum + Math.ceil(7 / interval)
    }, 0)
  }, [plants])

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
        { title: `Añadiste ${plants[0].nickname}`, when: "hace 1h", kind: "plant" as const },
        { title: "Regaste tus plantas", when: "hoy", kind: "water" as const },
        { title: "Foto de progreso guardada", when: "hoy", kind: "photo" as const },
        { title: "Tip de Toni guardado", when: "ayer", kind: "toni" as const },
      ]
    }

    return [
      { title: "Crea tu primera planta", when: "hoy", kind: "plant" as const },
      { title: "Habla con Toni", when: "hoy", kind: "toni" as const },
    ]
  }, [plants])

  const dash = isLoading || error ? "—" : null
  const dashboardTiles = [
    {
      icon: "🌱",
      label: "Plantas totales",
      value: dash ?? String(totalPlants),
      helper: totalPlants === 0 ? "Añade tu primera planta" : "En tu jardín",
    },
    {
      icon: "💧",
      label: "Riegos esta semana",
      value: dash ?? String(riegosEstaSemana),
      helper: riegosEstaSemana === 0 ? "Sin riegos pendientes" : "Estimado semanal",
    },
    {
      icon: "🌿",
      label: "Plantas exteriores",
      value: dash ?? String(outdoorCount),
      helper: outdoorCount === 0 ? "Ninguna registrada" : "Al aire libre",
    },
    {
      icon: "⭐",
      label: "Favoritas",
      value: dash ?? String(favoritesCount),
      helper: favoritesCount === 0 ? "Marca tus favoritas" : "Tus preferidas",
    },
  ]

  const highlightedPlants = useMemo(() => {
    const favorites = plants.filter((p) => p.is_favorite)
    const others = plants.filter((p) => !p.is_favorite)
    return [...favorites, ...others].slice(0, 4)
  }, [plants])

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
        <DashboardHero
          plantasNecesitanRiego={isLoading || error ? 0 : Math.min(totalPlants, 3)}
        />

        <div className="ag-divider ag-section" />

        <WeatherCard />

        <DashboardStats tiles={dashboardTiles} />

        <div className="ag-divider ag-section" />

        <div className="ag-section space-y-4">
          <section>
            <MiniTimeline
              title="Semana de cuidados"
              subtitle="Vista rápida"
              items={weeklyTimeline}
              ctaLabel="Ver plan"
              ctaHref="/plan"
            />
          </section>

          <QuickActions />

          <RecentActivity events={timelineEvents} isLoading={isLoading} />

          <GardenHighlights
            plants={highlightedPlants}
            totalCount={totalPlants}
            isLoading={isLoading}
            error={error}
            onRetry={loadPlants}
          />

          <ActivityChart values={activityValues} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
