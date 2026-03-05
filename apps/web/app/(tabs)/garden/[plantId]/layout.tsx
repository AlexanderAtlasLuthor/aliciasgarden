import type { ReactNode } from "react"

export const runtime = "edge"

type PlantDetailLayoutProps = {
  children: ReactNode
}

export default function PlantDetailLayout({ children }: PlantDetailLayoutProps) {
  return children
}
