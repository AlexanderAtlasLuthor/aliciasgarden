/* ------------------------------------------------------------------ */
/*  Weather theme map                                                  */
/* ------------------------------------------------------------------ */

type WeatherTheme = {
  icon: string
  condition: string
  temp: number
  rainChance: string
  wind: string
  gradient: string
  overlay: string          // extra CSS class for ambient layer
  toniTip: string
}

const WEATHER_THEMES: Record<"sunny" | "cloudy" | "rain", WeatherTheme> = {
  sunny: {
    icon: "☀️",
    condition: "Soleado",
    temp: 32,
    rainChance: "5%",
    wind: "brisa suave",
    gradient: "from-amber-500/20 via-orange-400/10 to-transparent",
    overlay: "weather-ambient-sunny",
    toniTip:
      "Hace calor — riega temprano o al atardecer para que el agua no se evapore.",
  },
  cloudy: {
    icon: "⛅",
    condition: "Parcialmente nublado",
    temp: 28,
    rainChance: "40%",
    wind: "viento leve",
    gradient: "from-slate-400/15 via-gray-500/10 to-transparent",
    overlay: "weather-ambient-cloudy",
    toniTip:
      "Hay probabilidad de lluvia esta tarde — puedes saltar el riego de las plantas de exterior hoy.",
  },
  rain: {
    icon: "🌧️",
    condition: "Lluvia ligera",
    temp: 22,
    rainChance: "85%",
    wind: "viento moderado",
    gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    overlay: "weather-ambient-rain",
    toniTip:
      "Llueve bastante hoy — no riegues y revisa que el drenaje de tus macetas funcione bien.",
  },
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const weatherType: "sunny" | "cloudy" | "rain" = "cloudy"

export default function WeatherCard() {
  const theme = WEATHER_THEMES[weatherType]

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
                Vidalia, GA · datos simulados
              </p>
            </div>
            <span className="text-3xl drop-shadow-lg">{theme.icon}</span>
          </div>

          {/* Main temperature block */}
          <div>
            <p className="text-5xl font-extralight tracking-tighter text-white/95 md:text-6xl">
              {theme.temp}
              <span className="text-3xl text-white/50 md:text-4xl">°C</span>
            </p>
            <p className="mt-1 text-sm font-medium text-white/60">
              {theme.condition}
            </p>
          </div>

          {/* Secondary details */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/55">
            <span>🌧 {theme.rainChance} probabilidad de lluvia</span>
            <span>💨 {theme.wind}</span>
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
