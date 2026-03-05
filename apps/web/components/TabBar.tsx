"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { TABS } from "@/lib/nav"

export default function TabBar() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="max-w-md mx-auto grid grid-cols-5 text-sm">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center py-2 ${
                isActive ? "text-green-600 font-medium" : "text-gray-500"
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
