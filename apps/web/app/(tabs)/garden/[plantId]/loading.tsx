import GlassSurface from "@/components/ui/GlassSurface"

const pulse = "animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8"

export default function PlantDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Header */}
      <section className="space-y-2">
        <div className={`h-5 w-28 ${pulse}`} />
        <div className={`h-7 w-44 ${pulse}`} />
        <div className={`h-4 w-56 ${pulse}`} />
      </section>

      {/* Resumen card */}
      <GlassSurface className="space-y-4 p-4 rounded-xl" variant="strong">
        <div className={`h-6 w-32 ${pulse}`} />
        <div className={`h-4 w-52 ${pulse}`} />
        <div className={`h-4 w-44 ${pulse}`} />
        <div className={`h-4 w-60 ${pulse}`} />
      </GlassSurface>

      {/* Métricas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassSurface key={i} className="space-y-3 p-4 rounded-2xl" variant="medium">
            <div className={`h-9 w-9 rounded-full ${pulse}`} />
            <div className={`h-5 w-24 ${pulse}`} />
            <div className={`h-4 w-20 ${pulse}`} />
          </GlassSurface>
        ))}
      </section>

      {/* Acciones card */}
      <GlassSurface className="space-y-5 p-4 rounded-xl" variant="medium">
        <div className={`h-6 w-40 ${pulse}`} />
        <div className="space-y-3 rounded-[var(--radius-3)] border border-white/10 bg-white/5 p-3">
          <div className={`h-4 w-32 ${pulse}`} />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-8 w-20 rounded-full ${pulse}`} />
            ))}
          </div>
          <div className={`h-9 w-full ${pulse}`} />
          <div className={`h-9 w-36 ${pulse}`} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={`h-10 ${pulse}`} />
          <div className={`h-10 ${pulse}`} />
          <div className={`h-10 ${pulse}`} />
        </div>
      </GlassSurface>

      {/* Timeline card */}
      <GlassSurface className="space-y-4 p-4 rounded-xl" variant="strong">
        <div className="flex items-center justify-between">
          <div className={`h-6 w-28 ${pulse}`} />
          <div className={`h-4 w-16 ${pulse}`} />
        </div>
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="rounded-[var(--radius-3)] border border-white/10 bg-white/6 p-3">
              <div className="space-y-2">
                <div className={`h-4 w-28 ${pulse}`} />
                <div className={`h-3 w-40 ${pulse}`} />
              </div>
            </li>
          ))}
        </ul>
      </GlassSurface>
    </div>
  )
}
