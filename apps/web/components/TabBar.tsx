"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { TABS } from "@/lib/nav"

export default function TabBar() {
  const pathname = usePathname()

  const isTabActive = (href: string): boolean => {
    if (href === "/home") {
      return pathname === href
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 gap-1.5 rounded-[var(--radius-6)] border border-border-weak bg-surface-glass-2 p-2 shadow-4 backdrop-blur-lg">
        {TABS.map((tab) => {
          const isActive = isTabActive(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-11 items-center justify-center rounded-[var(--radius-3)] px-2 py-2 text-[0.78rem] font-medium tracking-[0.01em] transition duration-200 ${
                isActive
                  ? "bg-[linear-gradient(135deg,var(--brand-300),var(--brand-600))] text-neutral-0 shadow-brand"
                  : "text-neutral-700 hover:bg-neutral-0/40 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
