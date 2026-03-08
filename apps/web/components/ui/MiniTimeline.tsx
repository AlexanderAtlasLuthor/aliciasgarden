import Link from "next/link"

import { cn } from "@/components/ui/cn"

type TimelineItem = {
  label: string
  intensity: number
  kind?: "water" | "light" | "note"
}

type MiniTimelineProps = {
  title: string
  subtitle?: string
  items: TimelineItem[]
  ctaLabel?: string
  ctaHref?: string
}

const glowByKind: Record<NonNullable<TimelineItem["kind"]>, string> = {
  water: "bg-[rgba(46,240,155,0.28)]",
  light: "bg-[rgba(92,203,255,0.28)]",
  note: "bg-[rgba(170,224,196,0.28)]",
}

const dotByKind: Record<NonNullable<TimelineItem["kind"]>, string> = {
  water: "bg-[rgba(46,240,155,0.65)] shadow-[0_0_12px_rgba(46,240,155,0.25)]",
  light: "bg-[rgba(92,203,255,0.62)] shadow-[0_0_12px_rgba(92,203,255,0.2)]",
  note: "bg-[rgba(170,224,196,0.62)] shadow-[0_0_12px_rgba(170,224,196,0.18)]",
}

export default function MiniTimeline({
  title,
  subtitle,
  items,
  ctaLabel,
  ctaHref,
}: MiniTimelineProps) {
  return (
    <section className="ag-emerald-plate relative overflow-hidden rounded-2xl border border-white/12 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_0%,rgba(46,240,155,0.12),transparent_55%)] before:content-['']">
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-primary text-base font-medium">{title}</h3>
            {subtitle ? <p className="text-secondary text-xs">{subtitle}</p> : null}
          </div>
          {ctaLabel && ctaHref ? (
            <Link
              href={ctaHref}
              className="text-secondary rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs transition-colors hover:bg-white/10 hover:text-primary"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {items.map((item) => {
            const clampedIntensity = Math.max(6, Math.min(100, item.intensity))
            const kind = item.kind ?? "water"

            return (
              <div key={`${item.label}-${kind}`} className="flex flex-col items-center gap-2">
                <div className="relative h-14 w-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 rounded-full transition-all duration-300",
                      glowByKind[kind]
                    )}
                    style={{ height: `${clampedIntensity}%` }}
                  />
                </div>
                <div className={cn("h-2 w-2 rounded-full", dotByKind[kind])} />
                <div className="text-muted text-xs">{item.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
