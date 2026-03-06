import GlassSurface from "@/components/ui/GlassSurface"

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"]

type ActivityChartProps = {
  values: number[]
  isLoading: boolean
}

export default function ActivityChart({ values, isLoading }: ActivityChartProps) {
  const maxValue = Math.max(...values, 1)

  return (
    <section>
      <GlassSurface className="space-y-4 p-4 md:p-5" variant="strong">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-white">Actividad semanal</p>
            <p className="text-xs text-white/45">Cuidados · últimos 7 días</p>
          </div>
        </div>
        {isLoading ? (
          <div className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/5" />
        ) : (
          <div className="space-y-2">
            <div className="flex h-28 items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 pb-2 pt-3">
              {values.map((value, index) => {
                const pct = Math.round((value / maxValue) * 100)
                const isToday = index === values.length - 1
                return (
                  <div key={`bar-${index}`} className="flex w-full flex-col items-center gap-1">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={[
                          "w-full rounded-md transition-all",
                          isToday
                            ? "bg-gradient-to-t from-emerald-500/50 to-emerald-300/30 border border-emerald-400/20"
                            : "bg-white/12 border border-white/8",
                        ].join(" ")}
                        style={{ height: `${pct}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 px-3">
              {DAY_LABELS.map((label, index) => (
                <span
                  key={label}
                  className={[
                    "w-full text-center text-[10px]",
                    index === DAY_LABELS.length - 1 ? "font-medium text-white/60" : "text-white/35",
                  ].join(" ")}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </GlassSurface>
    </section>
  )
}
