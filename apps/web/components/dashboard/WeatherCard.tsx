/* ------------------------------------------------------------------ */
/*  Weather theme map                                                  */
/* ------------------------------------------------------------------ */

type WeatherTheme = {
  icon: string
  condition: string
  overlay: string          // extra CSS class for ambient layer
  toniTip: string
}

type DaySegment = "dawn" | "morning" | "afternoon" | "night"

type CardPalette = {
  shellGradient: string
  orbPrimary: string
  orbSecondary: string
  tipBackground: string
}

const WEATHER_THEMES: Record<"sunny" | "clear-night" | "cloudy" | "rain", WeatherTheme> = {
  sunny: {
    icon: "☀️",
    condition: "Soleado",
    overlay: "weather-ambient-sunny",
    toniTip:
      "Hace calor — riega temprano o al atardecer para que el agua no se evapore.",
  },
  cloudy: {
    icon: "⛅",
    condition: "Parcialmente nublado",
    overlay: "weather-ambient-cloudy",
    toniTip:
      "Hay probabilidad de lluvia esta tarde — puedes saltar el riego de las plantas de exterior hoy.",
  },
  rain: {
    icon: "🌧️",
    condition: "Lluvia ligera",
    overlay: "weather-ambient-rain",
    toniTip:
      "Llueve bastante hoy — no riegues y revisa que el drenaje de tus macetas funcione bien.",
  },
  "clear-night": {
    icon: "🌙",
    condition: "Despejado",
    overlay: "weather-ambient-cloudy",
    toniTip:
      "La noche esta despejada — revisa humedad del sustrato y deja el riego para temprano.",
  },
}

const CARD_PALETTES: Record<WeatherCardProps["condition"], Record<DaySegment, CardPalette>> = {
  sunny: {
    dawn: {
      shellGradient:
        "linear-gradient(135deg, rgba(255, 191, 116, 0.22), rgba(255, 133, 76, 0.12) 38%, rgba(58, 28, 16, 0.48) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(255, 190, 108, 0.42), rgba(255, 190, 108, 0))",
      orbSecondary: "radial-gradient(circle, rgba(255, 227, 176, 0.25), rgba(255, 227, 176, 0))",
      tipBackground: "bg-white/[0.05]",
    },
    morning: {
      shellGradient:
        "linear-gradient(135deg, rgba(255, 224, 129, 0.22), rgba(251, 146, 60, 0.1) 38%, rgba(56, 33, 13, 0.46) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(255, 214, 130, 0.46), rgba(255, 214, 130, 0))",
      orbSecondary: "radial-gradient(circle, rgba(255, 240, 199, 0.22), rgba(255, 240, 199, 0))",
      tipBackground: "bg-white/[0.05]",
    },
    afternoon: {
      shellGradient:
        "linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(249, 115, 22, 0.12) 38%, rgba(54, 31, 14, 0.48) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(250, 204, 21, 0.44), rgba(250, 204, 21, 0))",
      orbSecondary: "radial-gradient(circle, rgba(255, 229, 156, 0.24), rgba(255, 229, 156, 0))",
      tipBackground: "bg-white/[0.05]",
    },
    night: {
      shellGradient:
        "linear-gradient(135deg, rgba(251, 146, 60, 0.16), rgba(194, 65, 12, 0.12) 38%, rgba(35, 20, 11, 0.5) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(251, 146, 60, 0.34), rgba(251, 146, 60, 0))",
      orbSecondary: "radial-gradient(circle, rgba(255, 206, 161, 0.2), rgba(255, 206, 161, 0))",
      tipBackground: "bg-white/[0.04]",
    },
  },
  cloudy: {
    dawn: {
      shellGradient:
        "linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(125, 141, 164, 0.11) 38%, rgba(24, 32, 43, 0.48) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(148, 163, 184, 0.34), rgba(148, 163, 184, 0))",
      orbSecondary: "radial-gradient(circle, rgba(203, 213, 225, 0.2), rgba(203, 213, 225, 0))",
      tipBackground: "bg-white/[0.045]",
    },
    morning: {
      shellGradient:
        "linear-gradient(135deg, rgba(176, 190, 208, 0.19), rgba(148, 163, 184, 0.11) 38%, rgba(27, 35, 47, 0.47) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(176, 190, 208, 0.33), rgba(176, 190, 208, 0))",
      orbSecondary: "radial-gradient(circle, rgba(226, 232, 240, 0.2), rgba(226, 232, 240, 0))",
      tipBackground: "bg-white/[0.045]",
    },
    afternoon: {
      shellGradient:
        "linear-gradient(135deg, rgba(125, 141, 164, 0.2), rgba(100, 116, 139, 0.12) 38%, rgba(22, 30, 42, 0.5) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(148, 163, 184, 0.34), rgba(148, 163, 184, 0))",
      orbSecondary: "radial-gradient(circle, rgba(203, 213, 225, 0.18), rgba(203, 213, 225, 0))",
      tipBackground: "bg-white/[0.04]",
    },
    night: {
      shellGradient:
        "linear-gradient(135deg, rgba(100, 116, 139, 0.18), rgba(71, 85, 105, 0.12) 38%, rgba(18, 24, 34, 0.52) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(125, 141, 164, 0.3), rgba(125, 141, 164, 0))",
      orbSecondary: "radial-gradient(circle, rgba(176, 190, 208, 0.17), rgba(176, 190, 208, 0))",
      tipBackground: "bg-white/[0.035]",
    },
  },
  rain: {
    dawn: {
      shellGradient:
        "linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(79, 70, 229, 0.12) 38%, rgba(16, 28, 48, 0.5) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(125, 211, 252, 0.33), rgba(125, 211, 252, 0))",
      orbSecondary: "radial-gradient(circle, rgba(191, 219, 254, 0.19), rgba(191, 219, 254, 0))",
      tipBackground: "bg-white/[0.04]",
    },
    morning: {
      shellGradient:
        "linear-gradient(135deg, rgba(125, 211, 252, 0.19), rgba(59, 130, 246, 0.13) 38%, rgba(15, 32, 54, 0.5) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(125, 211, 252, 0.34), rgba(125, 211, 252, 0))",
      orbSecondary: "radial-gradient(circle, rgba(186, 230, 253, 0.18), rgba(186, 230, 253, 0))",
      tipBackground: "bg-white/[0.04]",
    },
    afternoon: {
      shellGradient:
        "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(79, 70, 229, 0.14) 38%, rgba(13, 26, 45, 0.52) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(96, 165, 250, 0.35), rgba(96, 165, 250, 0))",
      orbSecondary: "radial-gradient(circle, rgba(191, 219, 254, 0.17), rgba(191, 219, 254, 0))",
      tipBackground: "bg-white/[0.04]",
    },
    night: {
      shellGradient:
        "linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(30, 64, 175, 0.14) 38%, rgba(10, 20, 36, 0.54) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(96, 165, 250, 0.29), rgba(96, 165, 250, 0))",
      orbSecondary: "radial-gradient(circle, rgba(147, 197, 253, 0.15), rgba(147, 197, 253, 0))",
      tipBackground: "bg-white/[0.03]",
    },
  },
  "clear-night": {
    dawn: {
      shellGradient:
        "linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(129, 140, 248, 0.13) 38%, rgba(24, 20, 43, 0.5) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(196, 181, 253, 0.32), rgba(196, 181, 253, 0))",
      orbSecondary: "radial-gradient(circle, rgba(224, 231, 255, 0.2), rgba(224, 231, 255, 0))",
      tipBackground: "bg-white/[0.04]",
    },
    morning: {
      shellGradient:
        "linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(99, 102, 241, 0.12) 38%, rgba(22, 18, 40, 0.5) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(167, 139, 250, 0.31), rgba(167, 139, 250, 0))",
      orbSecondary: "radial-gradient(circle, rgba(199, 210, 254, 0.19), rgba(199, 210, 254, 0))",
      tipBackground: "bg-white/[0.04]",
    },
    afternoon: {
      shellGradient:
        "linear-gradient(135deg, rgba(129, 140, 248, 0.19), rgba(79, 70, 229, 0.13) 38%, rgba(20, 17, 38, 0.52) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(165, 180, 252, 0.31), rgba(165, 180, 252, 0))",
      orbSecondary: "radial-gradient(circle, rgba(224, 231, 255, 0.17), rgba(224, 231, 255, 0))",
      tipBackground: "bg-white/[0.04]",
    },
    night: {
      shellGradient:
        "linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(67, 56, 202, 0.13) 38%, rgba(18, 15, 33, 0.54) 100%)",
      orbPrimary: "radial-gradient(circle, rgba(129, 140, 248, 0.3), rgba(129, 140, 248, 0))",
      orbSecondary: "radial-gradient(circle, rgba(199, 210, 254, 0.16), rgba(199, 210, 254, 0))",
      tipBackground: "bg-white/[0.03]",
    },
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

function getEtHour(dateLike?: string | null): number {
  const timeZone = "America/New_York"
  const parsedSource = dateLike ? new Date(dateLike) : null
  const baseDate = parsedSource && !Number.isNaN(parsedSource.getTime()) ? parsedSource : new Date()

  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone,
    }).format(baseDate)
  )
}

function getDaySegment(hour24: number): DaySegment {
  if (hour24 < 6) {
    return "dawn"
  }

  if (hour24 < 12) {
    return "morning"
  }

  if (hour24 < 19) {
    return "afternoon"
  }

  return "night"
}

function formatLiveDate(dateLike?: string | null): string {
  const timeZone = "America/New_York"
  const parsedSource = dateLike ? new Date(dateLike) : null
  const baseDate = parsedSource && !Number.isNaN(parsedSource.getTime()) ? parsedSource : new Date()

  const hour24 = getEtHour(dateLike)

  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(baseDate)
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(baseDate)

  const contextualPrefix =
    hour24 < 5 ? "Madrugada del" : hour24 >= 19 ? "Esta noche," : "Hoy,"

  return `${contextualPrefix} ${formattedDate} · ${formattedTime} ET`
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
  const daySegment = getDaySegment(getEtHour(current_time))
  const palette = CARD_PALETTES[condition][daySegment]

  return (
    <section>
      {/* Outer wrapper — soft glass, thinner than DashboardHero */}
      <div
        className="relative overflow-hidden rounded-3xl border border-white/12 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-md"
        style={{ background: palette.shellGradient }}
      >
        {/* ── Ambient background gradient ── */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 42%, rgba(0,0,0,0.14) 100%)",
          }}
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-xl"
          style={{ background: palette.orbPrimary }}
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-12 left-6 h-24 w-24 rounded-full blur-lg"
          style={{ background: palette.orbSecondary }}
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
          <div className={`rounded-xl px-3.5 py-2.5 ${palette.tipBackground}`}>
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
