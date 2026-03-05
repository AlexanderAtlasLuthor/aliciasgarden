"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import GlassSurface from "@/components/ui/GlassSurface"
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
    <div className="pointer-events-none fixed bottom-3 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-4">
        <GlassSurface className="pointer-events-auto rounded-[24px] px-4 py-2" variant="strong">
          <div className="flex items-center justify-between gap-1">
            {TABS.map((tab) => {
              const isActive = isTabActive(tab.href)

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex min-h-9 items-center justify-center px-3 py-1 text-[0.78rem] font-medium tracking-[0.01em] transition-all duration-200 ${
                    isActive
                      ? "rounded-full bg-white/10 text-white shadow-glow"
                      : "text-white/55 hover:text-white/80"
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </GlassSurface>
      </div>
    </div>
  )
}
