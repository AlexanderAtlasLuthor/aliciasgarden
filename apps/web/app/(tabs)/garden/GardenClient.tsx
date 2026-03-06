"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { cn } from "@/components/ui/cn"
import { patchPlant, type Plant } from "@/lib/api"
import PlantCard from "./PlantCard"

type FilterKey = "all" | "favorites" | "with-cover" | "without-cover"
type SortKey = "favorites" | "name-asc" | "newest"

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "favorites", label: "Favoritas" },
  { key: "with-cover", label: "Con foto" },
  { key: "without-cover", label: "Sin foto" },
]

const SORTS: { key: SortKey; label: string }[] = [
  { key: "favorites", label: "Favoritas primero" },
  { key: "name-asc", label: "Nombre A\u2013Z" },
  { key: "newest", label: "Más recientes" },
]

function filterPlants(plants: Plant[], filter: FilterKey): Plant[] {
  switch (filter) {
    case "favorites":
      return plants.filter((p) => p.is_favorite)
    case "with-cover":
      return plants.filter((p) => p.cover_photo_url || p.cover_photo_path)
    case "without-cover":
      return plants.filter((p) => !p.cover_photo_url && !p.cover_photo_path)
    default:
      return plants
  }
}

function sortPlants(plants: Plant[], sort: SortKey): Plant[] {
  const sorted = [...plants]
  switch (sort) {
    case "favorites":
      sorted.sort((a, b) => {
        const aFav = a.is_favorite ? 1 : 0
        const bFav = b.is_favorite ? 1 : 0
        return bFav - aFav
      })
      break
    case "name-asc":
      sorted.sort((a, b) => a.nickname.localeCompare(b.nickname))
      break
    case "newest":
      sorted.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      break
  }
  return sorted
}

/* ── Custom sort dropdown ── */

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey
  onChange: (v: SortKey) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const activeLabel = SORTS.find((s) => s.key === value)?.label ?? ""

  return (
    <div className="flex items-center gap-2">
      <span className="text-secondary text-xs font-medium">Ordenar por</span>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-1.5 rounded-[var(--radius-2)] border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-primary backdrop-blur-sm transition-colors hover:bg-white/10"
        >
          {activeLabel}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={cn("transition-transform", open && "rotate-180")}
            aria-hidden="true"
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open ? (
          <ul
            role="listbox"
            aria-label="Ordenar por"
            className="absolute right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-[var(--radius-2)] border border-white/10 bg-[var(--ag-bg1)] shadow-[var(--ag-shadow-2)] backdrop-blur-xl"
          >
            {SORTS.map(({ key, label }) => (
              <li
                key={key}
                role="option"
                aria-selected={key === value}
                onClick={() => {
                  onChange(key)
                  setOpen(false)
                }}
                className={cn(
                  "cursor-pointer px-3 py-2 text-xs transition-colors",
                  key === value
                    ? "bg-[rgba(90,255,170,0.15)] text-primary font-medium"
                    : "text-secondary hover:bg-white/8 hover:text-primary"
                )}
              >
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

/* ── Main garden client ── */

export default function GardenClient({ plants: initialPlants }: { plants: Plant[] }) {
  const [plants, setPlants] = useState(initialPlants)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [activeSort, setActiveSort] = useState<SortKey>("favorites")

  const result = useMemo(() => {
    const filtered = filterPlants(plants, activeFilter)
    return sortPlants(filtered, activeSort)
  }, [plants, activeFilter, activeSort])

  const handleToggleFavorite = useCallback(
    async (plantId: string) => {
      const plant = plants.find((p) => p.id === plantId)
      if (!plant) return

      const newValue = !plant.is_favorite

      // Optimistic update
      setPlants((prev) =>
        prev.map((p) =>
          p.id === plantId ? { ...p, is_favorite: newValue } : p
        )
      )

      try {
        await patchPlant(plantId, { is_favorite: newValue })
      } catch {
        // Revert on failure
        setPlants((prev) =>
          prev.map((p) =>
            p.id === plantId ? { ...p, is_favorite: !newValue } : p
          )
        )
      }
    },
    [plants]
  )

  return (
    <>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border",
              key === activeFilter
                ? "border-white/10 bg-[linear-gradient(135deg,rgba(90,255,170,0.35),rgba(20,160,90,0.35))] text-primary shadow-glow"
                : "border-white/10 bg-white/6 text-secondary hover:bg-white/10"
            )}
            aria-pressed={key === activeFilter}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <SortDropdown value={activeSort} onChange={setActiveSort} />

      {/* Grid or contextual empty */}
      {result.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-3">
            <p className="text-primary font-medium">No hay plantas para este filtro</p>
            <Button
              variant="secondary"
              size="sm"
              className="w-fit"
              onClick={() => setActiveFilter("all")}
            >
              Ver todas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {result.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </section>
      )}
    </>
  )
}
