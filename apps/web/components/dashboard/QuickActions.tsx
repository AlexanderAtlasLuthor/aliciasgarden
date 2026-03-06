import Link from "next/link"

import GlassSurface from "@/components/ui/GlassSurface"

const ACTIONS = [
  { icon: "💬", label: "Hablar con Toni", hint: "Pregunta lo que sea", href: "/toni" },
  { icon: "🌱", label: "Añadir planta", hint: "Nueva al jardín", href: "/garden/new" },
  { icon: "💧", label: "Registrar riego", hint: "Marca un riego", href: "/garden" },
  { icon: "📸", label: "Subir foto", hint: "Foto de progreso", href: "/garden" },
]

export default function QuickActions() {
  return (
    <section>
      <GlassSurface className="space-y-4 p-4 md:p-5" variant="medium">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-primary text-base font-semibold">Acciones rápidas</h2>
          <p className="text-xs text-white/40">Atajos</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3.5 text-center backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.1] hover:border-white/15"
            >
              <span className="text-xl transition-transform duration-200 group-hover:scale-110">
                {action.icon}
              </span>
              <span className="text-primary text-sm font-medium">{action.label}</span>
              <span className="text-[11px] text-white/40">{action.hint}</span>
            </Link>
          ))}
        </div>
      </GlassSurface>
    </section>
  )
}
