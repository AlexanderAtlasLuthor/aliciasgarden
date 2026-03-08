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
import { getPlants, getWeather, type Plant, type WeatherResponse } from "@/lib/api"

const WEATHER_FALLBACK: WeatherResponse = {
  temperature_c: 22,
  temperature_f: 72,
  rain_probability: 20,
  wind_speed: 5,
  humidity: 55,
  weather_code: 1,
  is_day: 1,
  condition: "sunny",
  condition_label: "Soleado",
  current_time: null,
}
const WEATHER_REFRESH_MS = 60 * 60 * 1000

function toMph(windSpeedKmh: number): number {
  return Math.round(windSpeedKmh * 0.621371)
}

export default function HomePage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlants = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const weatherPromise =
        typeof getWeather === "function"
          ? Promise.resolve(getWeather())
              .then((data) => data ?? WEATHER_FALLBACK)
              .catch(() => WEATHER_FALLBACK)
          : Promise.resolve(WEATHER_FALLBACK)

      const [plantList, weatherData] = await Promise.all([
        getPlants(),
        weatherPromise,
      ])

      setPlants(plantList)
      setWeather(weatherData)
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (typeof getWeather !== "function") {
        return
      }

      void Promise.resolve(getWeather())
        .then((latestWeather) => {
          if (latestWeather) {
            setWeather(latestWeather)
          }
        })
        .catch(() => {
          // Keep the last valid value when refresh fails.
        })
    }, WEATHER_REFRESH_MS)

    return () => {
      window.clearInterval(intervalId)
    }
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

  const effectiveWeather = weather ?? WEATHER_FALLBACK
  const roundedTemperature = Math.round(effectiveWeather.temperature_f)
  const roundedWindSpeedMph = toMph(effectiveWeather.wind_speed)

  return (
    <div className="ag-container ag-screen">
      <div className="ag-panel">
        <DashboardHero
          plantasNecesitanRiego={isLoading || error ? 0 : Math.min(totalPlants, 3)}
          probabilidadLluvia={effectiveWeather.rain_probability}
          temperatura={roundedTemperature}
        />

        <div className="ag-divider ag-section" />

        {weather ? (
          <WeatherCard
            temperature={roundedTemperature}
            rain_probability={effectiveWeather.rain_probability}
            wind_speed={roundedWindSpeedMph}
            humidity={Math.round(effectiveWeather.humidity)}
            condition={effectiveWeather.condition}
            condition_label={effectiveWeather.condition_label}
            current_time={effectiveWeather.current_time}
          />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-6 text-sm text-white/55 backdrop-blur-md">
            Cargando clima...
          </div>
        )}

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
