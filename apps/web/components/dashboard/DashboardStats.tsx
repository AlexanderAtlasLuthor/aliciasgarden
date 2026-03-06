import MetricTile from "@/components/ui/MetricTile"

export type DashboardTile = {
  icon: string
  label: string
  value: string
  helper: string
}

type DashboardStatsProps = {
  tiles: DashboardTile[]
}

export default function DashboardStats({ tiles }: DashboardStatsProps) {
  return (
    <section className="ag-section grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((tile) => (
        <MetricTile
          key={tile.label}
          icon={tile.icon}
          label={tile.label}
          value={tile.value}
          helper={tile.helper}
        />
      ))}
    </section>
  )
}
