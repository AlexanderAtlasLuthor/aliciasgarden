/* ------------------------------------------------------------------ */
/*  Weather theme map                                                  */
/* ------------------------------------------------------------------ */

type WeatherTheme = {
  icon: string
  condition: string
  gradient: string
  overlay: string          // extra CSS class for ambient layer
  toniTip: string
}

const WEATHER_THEMES: Record<"sunny" | "clear-night" | "cloudy" | "rain", WeatherTheme> = {
  sunny: {
    icon: "☀️",
    condition: "Soleado",
    gradient: "from-amber-500/20 via-orange-400/10 to-transparent",
    overlay: "weather-ambient-sunny",
    toniTip:
      "Hace calor — riega temprano o al atardecer para que el agua no se evapore.",
  },
  cloudy: {
    icon: "⛅",
    condition: "Parcialmente nublado",
    gradient: "from-slate-400/15 via-gray-500/10 to-transparent",
    overlay: "weather-ambient-cloudy",
    toniTip:
      "Hay probabilidad de lluvia esta tarde — puedes saltar el riego de las plantas de exterior hoy.",
  },
  rain: {
    icon: "🌧️",
    condition: "Lluvia ligera",
    gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    overlay: "weather-ambient-rain",
    toniTip:
      "Llueve bastante hoy — no riegues y revisa que el drenaje de tus macetas funcione bien.",
  },
  "clear-night": {
    icon: "🌙",
    condition: "Despejado",
    gradient: "from-indigo-500/20 via-slate-500/15 to-transparent",
    overlay: "weather-ambient-cloudy",
    toniTip:
      "La noche esta despejada — revisa humedad del sustrato y deja el riego para temprano.",
  },
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type WeatherCardProps = {
  temperature: number
  rain_probability: number
  wind_speed: number
  humidity: number
  condition: "sunny" | "clear-night" | "cloudy" | "rain"
  condition_label: string
  current_time?: string | null
}

function formatLiveDate(currentTime?: string | null): string {
  const parsed = currentTime ? new Date(currentTime) : new Date()
  const baseDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  const formatted = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(baseDate)

  return `Hoy, ${formatted}`
}

export default function WeatherCard({
  temperature,
  rain_probability,
  wind_speed,
  humidity,
  condition,
  condition_label,
  current_time,
}: WeatherCardProps) {
  const theme = WEATHER_THEMES[condition]
  const liveDateLabel = formatLiveDate(current_time)

  return (
    <section>
      {/* Outer wrapper — soft glass, thinner than DashboardHero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] shadow-[0_6px_24px_rgba(0,0,0,0.22)] backdrop-blur-md">
        {/* ── Ambient background gradient ── */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.gradient}`}
          aria-hidden="true"
        />

        {/* ── Animated ambient overlay ── */}
        <div
          className={`pointer-events-none absolute inset-0 ${theme.overlay}`}
          aria-hidden="true"
        />

        {/* ── Content ── */}
        <div className="relative z-10 space-y-4 p-5 md:p-7">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold tracking-tight text-white/90">
                Clima hoy
              </h2>
              <p className="text-[11px] text-white/40">
                {liveDateLabel}
              </p>
            </div>
            <span className="text-3xl drop-shadow-lg">{theme.icon}</span>
          </div>

          {/* Main temperature block */}
          <div>
            <p className="text-5xl font-extralight tracking-tighter text-white/95 md:text-6xl">
              {Math.round(temperature)}
              <span className="text-3xl text-white/50 md:text-4xl">°F</span>
            </p>
            <p className="mt-1 text-sm font-medium text-white/60">
              {condition_label || theme.condition}
            </p>
          </div>

          {/* Secondary details */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/55">
            <span>🌧 {Math.round(rain_probability)}% probabilidad de lluvia</span>
            <span>💨 {Math.round(wind_speed)} mph</span>
            <span>💧 {Math.round(humidity)}% humedad</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.07]" />

          {/* Toni recommendation */}
          <div className="rounded-xl bg-white/[0.04] px-3.5 py-2.5">
            <p className="text-[13px] leading-relaxed text-white/55">
              <span className="font-medium text-white/70">💡 Toni dice:</span>{" "}
              {theme.toniTip}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
