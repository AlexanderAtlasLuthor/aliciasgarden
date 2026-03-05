import { cn } from "@/components/ui/cn"
import { Card } from "@/components/ui/Card"

type MetricTileProps = {
  icon?: React.ReactNode
  label: string
  value: string | number
  helper?: string
  variant?: "default" | "good" | "warn"
}

const glowByVariant: Record<NonNullable<MetricTileProps["variant"]>, string> = {
  default:
    "before:bg-[radial-gradient(circle_at_30%_20%,rgba(46,240,155,0.16),transparent_55%)]",
  good:
    "before:bg-[radial-gradient(circle_at_30%_20%,rgba(46,240,155,0.22),transparent_58%)]",
  warn:
    "before:bg-[radial-gradient(circle_at_30%_20%,rgba(204,184,78,0.2),transparent_58%)]",
}

export default function MetricTile({
  icon,
  label,
  value,
  helper,
  variant = "default",
}: MetricTileProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/12 bg-white/6 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-[rgba(46,240,155,0.35)] before:absolute before:inset-0 before:opacity-100 before:content-['']",
        glowByVariant[variant]
      )}
      variant="medium"
    >
      <div className="relative flex min-h-[110px] flex-col justify-between">
        <div>
          {icon ? (
            <div className="text-secondary inline-flex items-center justify-center rounded-full border border-white/35 bg-[#2a5a4a] px-2 py-1 text-xs">
              {icon}
            </div>
          ) : null}
          <p className="text-primary mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="text-secondary mt-1 text-sm">{label}</p>
        </div>
        {helper ? <p className="text-muted mt-3 text-xs">{helper}</p> : null}
      </div>
    </Card>
  )
}
