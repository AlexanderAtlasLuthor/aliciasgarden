import Image from "next/image"
import GlassSurface from "@/components/ui/GlassSurface"

export default function TabsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex justify-center">
        <Image src="/AG Logo.png" alt="Alicia's Garden" width={56} height={56} priority />
      </div>

      <section className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
        <div className="h-4 w-64 animate-pulse rounded-[var(--radius-2)] border border-white/10 bg-white/8" />
      </section>

      <section className="space-y-3">
        <GlassSurface className="p-4" variant="strong">
          <div className="h-20 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
        </GlassSurface>
        <GlassSurface className="p-4" variant="strong">
          <div className="h-20 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
        </GlassSurface>
        <GlassSurface className="p-4" variant="strong">
          <div className="h-20 animate-pulse rounded-[var(--radius-3)] border border-white/10 bg-white/8" />
        </GlassSurface>
      </section>
    </div>
  )
}
