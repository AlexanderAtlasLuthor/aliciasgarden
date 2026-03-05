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
  default: "bg-[#2a5a4a]",
  good: "bg-[#2d6b4f]",
  warn: "bg-[#6a5b2d]",
}

export default function MetricTile({
  icon,
  label,
  value,
  helper,
  variant = "default",
}: MetricTileProps) {
  const isLongValue = String(value).length > 12

  return (
    <Card variant="medium" className="rounded-2xl">
      <div className="min-w-0 space-y-3 p-4">
        {icon ? (
          <div
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 backdrop-blur-md",
              glowByVariant[variant]
            )}
          >
            <span className="text-base leading-none">{icon}</span>
          </div>
        ) : null}

        <div className="min-w-0 space-y-1">
          <p
            className={cn(
              "min-w-0 font-semibold tracking-tight text-text-primary",
              isLongValue ? "text-ag-h3 leading-tight break-words" : "text-ag-h2 leading-none"
            )}
          >
            {value}
          </p>
          <p className="text-ag-h3 text-text-muted">{label}</p>
        </div>

        {helper ? <p className="ag-truncate text-ag-caption text-text-muted">{helper}</p> : null}
      </div>
    </Card>
  )
}
