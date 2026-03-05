import GlassSurface from "@/components/ui/GlassSurface"

export default function PlantDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <section className="space-y-2">
        <div className="h-7 w-44 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
        <div className="h-4 w-72 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
      </section>

      <GlassSurface className="space-y-4 p-4" variant="strong">
        <div className="h-6 w-40 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
        <div className="h-4 w-52 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
        <div className="h-4 w-64 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
        <div className="h-24 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
      </GlassSurface>
    </div>
  )
}
