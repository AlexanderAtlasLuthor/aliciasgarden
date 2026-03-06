"use client"

import { useEffect, useMemo, useState } from "react"

import GlassSurface from "@/components/ui/GlassSurface"

const TIP_SLIDESHOW_MS = 10000

type ToniTip = {
  topic: string
  emoji: string
  gradient: string
  text: string
}

const TONI_DAILY_TIPS: ToniTip[] = [
  // ── Riego ──
  {
    topic: "Riego",
    emoji: "💧",
    gradient: "from-sky-500/25 to-cyan-600/15",
    text: "Riega temprano: así la planta absorbe mejor y evitas hongos por la noche.",
  },
  {
    topic: "Riego",
    emoji: "💧",
    gradient: "from-sky-500/25 to-cyan-600/15",
    text: "Mete el dedo 2-3 cm en la tierra: si sigue húmeda, espera antes de volver a regar.",
  },
  {
    topic: "Riego",
    emoji: "💧",
    gradient: "from-sky-500/25 to-cyan-600/15",
    text: "En verano riega al atardecer para que el agua no se evapore tan rápido.",
  },
  {
    topic: "Riego",
    emoji: "💧",
    gradient: "from-sky-500/25 to-cyan-600/15",
    text: "Usa agua a temperatura ambiente; el agua muy fría puede estresar las raíces.",
  },
  // ── Hojas ──
  {
    topic: "Hojas",
    emoji: "🍃",
    gradient: "from-emerald-500/25 to-green-600/15",
    text: "Limpia las hojas con un paño húmedo una vez por semana para mejorar la fotosíntesis.",
  },
  {
    topic: "Hojas",
    emoji: "🍃",
    gradient: "from-emerald-500/25 to-green-600/15",
    text: "Si una hoja amarillea, revisa primero drenaje y exceso de agua antes de abonar.",
  },
  {
    topic: "Hojas",
    emoji: "🍃",
    gradient: "from-emerald-500/25 to-green-600/15",
    text: "Retira hojas secas o dañadas para que la planta concentre energía en las sanas.",
  },
  // ── Luz ──
  {
    topic: "Luz",
    emoji: "☀️",
    gradient: "from-amber-500/25 to-yellow-600/15",
    text: "Gira la maceta un cuarto de vuelta cada semana para que crezca pareja hacia la luz.",
  },
  {
    topic: "Luz",
    emoji: "☀️",
    gradient: "from-amber-500/25 to-yellow-600/15",
    text: "Si las hojas se estiran mucho hacia un lado, tu planta necesita más luz directa.",
  },
  {
    topic: "Luz",
    emoji: "☀️",
    gradient: "from-amber-500/25 to-yellow-600/15",
    text: "Las plantas de interior agradecen la luz filtrada; evita el sol directo del mediodía.",
  },
  // ── Abono ──
  {
    topic: "Abono",
    emoji: "🌾",
    gradient: "from-lime-500/25 to-emerald-600/15",
    text: "Abona en dosis suaves durante crecimiento activo; menos es mejor que pasarte.",
  },
  {
    topic: "Abono",
    emoji: "🌾",
    gradient: "from-lime-500/25 to-emerald-600/15",
    text: "En invierno la mayoría de plantas descansan — pausa el abono hasta primavera.",
  },
  {
    topic: "Abono",
    emoji: "🌾",
    gradient: "from-lime-500/25 to-emerald-600/15",
    text: "El agua de cocción de verduras (sin sal) es un abono casero suave y efectivo.",
  },
  // ── Plagas ──
  {
    topic: "Plagas",
    emoji: "🐛",
    gradient: "from-rose-500/25 to-pink-600/15",
    text: "Revisa el envés de las hojas cada semana; ahí se esconden los primeros bichitos.",
  },
  {
    topic: "Plagas",
    emoji: "🐛",
    gradient: "from-rose-500/25 to-pink-600/15",
    text: "Un chorro suave de agua puede eliminar pulgones sin necesidad de químicos.",
  },
  {
    topic: "Plagas",
    emoji: "🐛",
    gradient: "from-rose-500/25 to-pink-600/15",
    text: "Mantén las plantas limpias y ventiladas: eso solo ya previene muchas plagas.",
  },
  // ── Macetas ──
  {
    topic: "Macetas",
    emoji: "🪴",
    gradient: "from-orange-500/25 to-amber-600/15",
    text: "Asegúrate de que la maceta tenga agujeros de drenaje; las raíces no deben encharcarse.",
  },
  {
    topic: "Macetas",
    emoji: "🪴",
    gradient: "from-orange-500/25 to-amber-600/15",
    text: "Las macetas de barro respiran mejor que las de plástico y ayudan a regular la humedad.",
  },
  // ── Trasplante ──
  {
    topic: "Trasplante",
    emoji: "🔄",
    gradient: "from-violet-500/25 to-purple-600/15",
    text: "Trasplanta en primavera cuando la planta está activa; se recupera mucho más rápido.",
  },
  {
    topic: "Trasplante",
    emoji: "🔄",
    gradient: "from-violet-500/25 to-purple-600/15",
    text: "Elige una maceta solo un poco más grande; demasiado espacio retiene humedad de más.",
  },
  // ── Humedad ──
  {
    topic: "Humedad",
    emoji: "💦",
    gradient: "from-teal-500/25 to-cyan-600/15",
    text: "Agrupa tus plantas: juntas crean un microclima más húmedo que les beneficia.",
  },
  {
    topic: "Humedad",
    emoji: "💦",
    gradient: "from-teal-500/25 to-cyan-600/15",
    text: "Pon un plato con agua y piedras bajo la maceta para subir la humedad sin encharcar.",
  },
  // ── Poda ──
  {
    topic: "Poda",
    emoji: "✂️",
    gradient: "from-fuchsia-500/25 to-pink-600/15",
    text: "Poda las puntas secas con tijeras limpias para estimular nuevo crecimiento.",
  },
  {
    topic: "Poda",
    emoji: "✂️",
    gradient: "from-fuchsia-500/25 to-pink-600/15",
    text: "Corta siempre justo por encima de un nudo; ahí es donde brotará la nueva rama.",
  },
  {
    topic: "Poda",
    emoji: "✂️",
    gradient: "from-fuchsia-500/25 to-pink-600/15",
    text: "Podar con regularidad mantiene la forma compacta y bonita de la planta.",
  },
]

export interface DashboardHeroProps {
  plantasNecesitanRiego?: number
  probabilidadLluvia?: number
  temperatura?: number
  resumen?: string
}

export default function DashboardHero({
  plantasNecesitanRiego = 3,
  probabilidadLluvia = 20,
  temperatura = 24,
  resumen = "Tu jardín se ve bien. Unas plantas necesitan atención hoy.",
}: DashboardHeroProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Shuffle tips once on mount so categories don't cluster together
  const shuffledTips = useMemo(() => {
    const arr = [...TONI_DAILY_TIPS]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % shuffledTips.length)
    }, TIP_SLIDESHOW_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()

    if (hour < 12) {
      return "Buenos días, Alicia"
    }

    if (hour < 19) {
      return "Buenas tardes, Alicia"
    }

    return "Buenas noches, Alicia"
  }, [])

  const currentTip = shuffledTips[currentTipIndex]

  const statusIndicators = [
    { icon: "💧", label: "Necesitan riego", value: `${plantasNecesitanRiego} plantas` },
    { icon: "🌧️", label: "Prob. lluvia", value: `${probabilidadLluvia}%` },
    { icon: "🌡️", label: "Temperatura", value: `${temperatura}°C` },
  ]

  return (
    <section>
      <GlassSurface variant="strong" className="rounded-3xl p-5 md:p-7">
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-white/60">{greeting}</p>
            <h1 className="text-primary text-2xl font-bold tracking-tight md:text-3xl">
              Estado del jardín hoy
            </h1>
            <p className="text-secondary text-sm leading-relaxed">{resumen}</p>
          </div>

          {/* Quick status indicators */}
          <div className="grid grid-cols-3 gap-2.5">
            {statusIndicators.map((indicator) => (
              <div
                key={indicator.label}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-center backdrop-blur-sm"
              >
                <span className="text-lg">{indicator.icon}</span>
                <p className="text-primary mt-1 text-sm font-semibold">{indicator.value}</p>
                <p className="mt-0.5 text-[11px] text-white/50">{indicator.label}</p>
              </div>
            ))}
          </div>

          {/* Toni tip */}
          <div className="overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-500/10 backdrop-blur-md">
            <div className="flex gap-0">
              <div className={`flex w-16 shrink-0 items-center justify-center bg-gradient-to-br ${currentTip.gradient} md:w-20`}>
                <span className="text-2xl md:text-3xl">{currentTip.emoji}</span>
              </div>
              <div className="min-w-0 flex-1 px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs">🌱</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                    Tip de Toni
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/45">
                    {currentTip.topic}
                  </span>
                </div>
                <p className="text-secondary mt-1.5 text-sm leading-relaxed">{currentTip.text}</p>
              </div>
            </div>
          </div>
        </div>
      </GlassSurface>
    </section>
  )
}
