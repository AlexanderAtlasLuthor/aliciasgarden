"use client"

import { useState } from "react"
import Link from "next/link"

import Button from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { AGGlass } from "@/components/ui/AGGlass"
import GlassSurface from "@/components/ui/GlassSurface"
import type { Plant } from "@/lib/api"

type GardenHighlightsProps = {
  plants: Plant[]
  totalCount: number
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

function HighlightCard({ plant }: { plant: Plant }) {
  const [imgError, setImgError] = useState(false)
  const showImg = plant.cover_photo_url && !imgError

  return (
    <Link
      href={`/garden/${plant.id}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
      aria-label={`Ver ficha de ${plant.nickname}`}
    >
      <Card
        interactive
        className="relative aspect-[4/5] overflow-hidden rounded-2xl transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl"
      >
        {showImg ? (
          <img
            src={plant.cover_photo_url!}
            alt={plant.nickname}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-500/30 to-brand-700/40">
            <span className="text-3xl" aria-hidden="true">🌿</span>
          </div>
        )}

        <AGGlass className="absolute bottom-2 left-2 right-2 rounded-xl px-2.5 py-1.5">
          <p className="text-primary truncate text-xs font-medium">
            {plant.is_favorite ? <span aria-hidden="true">★ </span> : null}
            {plant.nickname}
          </p>
          {plant.species_common ? (
            <p className="truncate text-[10px] text-white/50">{plant.species_common}</p>
          ) : null}
        </AGGlass>
      </Card>
    </Link>
  )
}

export default function GardenHighlights({ plants, totalCount, isLoading, error, onRetry }: GardenHighlightsProps) {
  const hasMore = totalCount > plants.length

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-primary text-lg font-semibold">Favoritas del jardín</h2>
          <p className="text-xs text-white/50">Tus plantas destacadas</p>
        </div>
        {hasMore ? (
          <Link href="/garden" className="text-secondary text-sm transition-colors hover:text-primary">
            Ver todo mi jardín →
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-live="polite">
          <GlassSurface className="aspect-[4/5] animate-pulse rounded-2xl border-white/15 bg-gradient-to-br from-white/10 to-emerald-200/10" />
          <GlassSurface className="aspect-[4/5] animate-pulse rounded-2xl border-white/15 bg-gradient-to-br from-white/10 to-cyan-200/10" />
        </div>
      ) : null}

      {!isLoading && error ? (
        <GlassSurface
          role="alert"
          className="space-y-3 rounded-2xl border-red-300/35 bg-red-500/10 p-4 text-red-100"
          variant="strong"
        >
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={() => {
              void onRetry()
            }}
            className="inline-flex items-center justify-center rounded-lg border border-red-200/40 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-100"
          >
            Reintentar
          </button>
        </GlassSurface>
      ) : null}

      {!isLoading && !error && totalCount === 0 ? (
        <GlassSurface variant="strong" className="rounded-2xl p-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium text-white">Aún no tienes plantas 🌿</p>
              <p className="text-sm text-white/70">
                Añade tu primera planta para empezar a llevar seguimiento.
              </p>
            </div>
            <Button asChild variant="secondary" size="sm" className="w-fit">
              <Link href="/garden/new">Añadir planta</Link>
            </Button>
          </div>
        </GlassSurface>
      ) : null}

      {!isLoading && !error && plants.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {plants.map((plant) => (
            <HighlightCard key={plant.id} plant={plant} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
