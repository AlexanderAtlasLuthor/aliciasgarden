export type TabItem = {
  label: string
  href: string
}

export const TABS: TabItem[] = [
  { label: "Inicio", href: "/home" },
  { label: "Toni", href: "/toni" },
  { label: "Mi Jardín", href: "/garden" },
  { label: "Plan", href: "/plan" },
  { label: "Ajustes", href: "/settings" }
]
