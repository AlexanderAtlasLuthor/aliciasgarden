import GlassSurface from "@/components/ui/GlassSurface"

export default function ToniLoading() {
  return (
    <div className="space-y-4 pb-24" aria-busy="true" aria-live="polite">
      <section className="space-y-2">
        <div className="h-7 w-20 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
        <div className="h-4 w-72 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
      </section>

      <section className="space-y-3">
        <GlassSurface className="w-3/4 p-4" variant="strong">
          <div className="h-16 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
        </GlassSurface>
        <GlassSurface className="ml-auto w-2/3 p-4" variant="strong">
          <div className="h-16 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
        </GlassSurface>
        <GlassSurface className="w-4/5 p-4" variant="strong">
          <div className="h-16 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
        </GlassSurface>
      </section>

      <GlassSurface className="p-4" variant="strong">
        <div className="h-10 w-full animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
      </GlassSurface>
    </div>
  )
}
