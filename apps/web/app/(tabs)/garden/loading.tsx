import GlassSurface from "@/components/ui/GlassSurface"

export default function GardenLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <section className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
        <div className="h-4 w-72 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
      </section>

      <div className="h-11 w-full animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassSurface key={i} className="aspect-[3/4] overflow-hidden rounded-2xl p-0" variant="strong">
            <div className="h-full w-full animate-pulse rounded-2xl border border-white/10 bg-white/8" />
          </GlassSurface>
        ))}
      </section>
    </div>
  )
}
