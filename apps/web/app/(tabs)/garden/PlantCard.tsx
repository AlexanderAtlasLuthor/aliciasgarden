"use client"

import { useState } from "react"
import Link from "next/link"

import { Card } from "@/components/ui/Card"
import { AGGlass } from "@/components/ui/AGGlass"
import type { Plant } from "@/lib/api"

export default function PlantCard({ plant }: { plant: Plant }) {
  const [imgError, setImgError] = useState(false)
  const showImg = plant.cover_photo_url && !imgError

  return (
    <Link
      href={`/garden/${plant.id}`}
      className="block cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
      aria-label={`Ver ficha de ${plant.nickname}`}
    >
      <Card
        interactive
        className="relative aspect-[3/4] overflow-hidden rounded-2xl transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl"
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
            <span className="text-4xl" aria-hidden="true">🌿</span>
          </div>
        )}

        <AGGlass className="absolute bottom-2 left-2 right-2 rounded-2xl px-3 py-1.5">
          <p className="text-primary truncate text-sm font-medium">{plant.nickname}</p>
        </AGGlass>
      </Card>
    </Link>
  )
}
