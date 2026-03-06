import GlassSurface from "@/components/ui/GlassSurface"

export type EventKind = "plant" | "water" | "photo" | "edit" | "toni"

export type TimelineEvent = {
  title: string
  when: string
  kind?: EventKind
}

const EVENT_ICON: Record<EventKind, string> = {
  plant: "🌱",
  water: "💧",
  photo: "📸",
  edit: "✏️",
  toni: "💬",
}

type RecentActivityProps = {
  events: TimelineEvent[]
  isLoading: boolean
}

export default function RecentActivity({ events, isLoading }: RecentActivityProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-primary text-base font-semibold">Actividad reciente</h2>

      {isLoading ? (
        <GlassSurface className="h-28 animate-pulse border-white/15 bg-white/6" variant="strong" />
      ) : (
        <GlassSurface className="divide-y divide-white/[0.06] p-3" variant="strong">
          {events.map((event, index) => {
            const icon = EVENT_ICON[event.kind ?? "edit"]
            return (
              <div
                key={`${event.title}-${index}`}
                className="flex items-center gap-3 px-1 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm"
                  aria-hidden="true"
                >
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90">{event.title}</p>
                </div>
                <span className="shrink-0 text-[11px] text-white/40">{event.when}</span>
              </div>
            )
          })}
        </GlassSurface>
      )}
    </section>
  )
}
