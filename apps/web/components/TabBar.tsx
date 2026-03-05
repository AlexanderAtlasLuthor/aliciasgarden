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
    <div className="pointer-events-none fixed bottom-3 left-0 right-0 z-30 hidden pb-[env(safe-area-inset-bottom)] md:block">
      <div className="mx-auto w-full max-w-md px-4 sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <div className="pointer-events-auto rounded-full border border-white/28 bg-[#153b2f] px-2 py-2 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-5 gap-1">
            {TABS.map((tab) => {
              const isActive = isTabActive(tab.href)

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex h-9 flex-col items-center justify-center rounded-full border px-2 text-[0.86rem] tracking-[0.005em] transition-all duration-200 ease-out ${
                    isActive
                      ? "scale-[1.01] border-white/45 bg-[#2a5a4a] text-white font-semibold"
                      : "border-transparent text-white font-medium hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
