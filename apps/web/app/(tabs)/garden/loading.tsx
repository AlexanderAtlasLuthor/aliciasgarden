import GlassSurface from "@/components/ui/GlassSurface"

export default function GardenLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <section className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
        <div className="h-4 w-72 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
      </section>

      <div className="h-11 w-full animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />

      <section className="space-y-3">
        <GlassSurface className="p-4" variant="strong">
          <div className="h-24 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
        </GlassSurface>
        <GlassSurface className="p-4" variant="strong">
          <div className="h-24 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
        </GlassSurface>
        <GlassSurface className="p-4" variant="strong">
          <div className="h-24 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
        </GlassSurface>
      </section>
    </div>
  )
}
