import GlassSurface from "@/components/ui/GlassSurface"

type MetricTileProps = {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

export default function MetricTile({ icon, label, value }: MetricTileProps) {
  return (
    <GlassSurface className="flex flex-col gap-1.5 p-4" variant="strong">
      <div className="text-xl leading-none">{icon}</div>
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </GlassSurface>
  )
}