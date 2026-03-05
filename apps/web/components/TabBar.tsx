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
    <div
      className="fixed bottom-0 left-0 right-0 border-t border-ag-border bg-ag-surface shadow-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 py-2 text-sm">
        {TABS.map((tab) => {
          const isActive = isTabActive(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center rounded-xl px-2 py-2 transition ${
                isActive
                  ? "bg-ag-bg font-medium text-ag-primary"
                  : "text-gray-600 hover:text-ag-text"
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
