"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { TABS } from "@/lib/nav"

type HeaderProps = {
  title: string
}

const MAIN_LINKS = [
  { label: "Inicio", href: "/home", icon: "🏠" },
  { label: "Jardín", href: "/garden", icon: "🌿" },
  { label: "Toni", href: "/toni", icon: "🤖" },
]

const SECONDARY_LINKS = [
  { label: "Plan", href: "/plan", icon: "📅" },
  { label: "Ajustes", href: "/settings", icon: "⚙️" },
]

export default function Header({ title }: HeaderProps) {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!isDrawerOpen) {
      document.body.style.overflow = ""
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isDrawerOpen])

  const isLinkActive = (href: string): boolean => {
    if (href === "/home") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="relative z-40 pt-[env(safe-area-inset-top)]">
      <div className="ag-container">
        {/* Mobile / tablet header */}
        <div className="ag-emerald-plate relative flex items-center justify-center rounded-[24px] border border-white/28 px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.45)] lg:hidden">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setIsDrawerOpen(true)}
            className="ag-emerald-plate absolute left-2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white/90 transition active:scale-[0.98] md:hidden"
          >
            <span className="text-2xl leading-none">☰</span>
          </button>

          <div className="flex min-w-0 flex-col items-center justify-center gap-1">
            <Link
              href="/home"
              aria-label="Ir al dashboard"
              className="ag-emerald-plate flex h-16 w-16 items-center justify-center rounded-full border border-white/35 transition hover:brightness-110"
            >
              <Image src="/ag-logo-white.png" alt="AG" width={42} height={42} priority unoptimized />
            </Link>
            <span className="text-primary text-xs font-medium tracking-[0.02em] md:hidden">{title}</span>
          </div>

          <span className="absolute right-2 h-12 w-12 md:hidden" aria-hidden="true" />
        </div>

        {/* Desktop header with horizontal nav */}
        <div className="ag-emerald-plate hidden lg:flex items-center justify-between rounded-[24px] border border-white/28 px-5 py-2.5 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              aria-label="Ir al dashboard"
              className="ag-emerald-plate flex h-10 w-10 items-center justify-center rounded-full border border-white/35 transition hover:brightness-110"
            >
              <Image src="/ag-logo-white.png" alt="AG" width={28} height={28} priority unoptimized />
            </Link>
            <span className="text-sm font-semibold tracking-[0.02em] text-white/90">
              Alicia&apos;s Garden
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {TABS.map((tab) => {
              const active = isLinkActive(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative rounded-full px-4 py-1.5 text-[0.84rem] font-medium tracking-wide transition-all duration-200 ${
                    active
                      ? "ag-emerald-plate text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : "text-white/60 hover:bg-white/6 hover:text-white/90"
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" aria-hidden={false}>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setIsDrawerOpen(false)}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="ag-emerald-plate relative flex h-full w-[82vw] max-w-[20rem] flex-col border-r border-white/18 pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),1rem)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <p className="text-sm font-semibold tracking-[0.03em] text-white/90">
                Navegación
              </p>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setIsDrawerOpen(false)}
                className="ag-emerald-plate flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-xs text-white/60 transition active:scale-95"
              >
                ✕
              </button>
            </div>
            <div className="mx-5 h-px bg-white/[0.08]" />

            {/* Nav sections */}
            <nav className="flex-1 overflow-y-auto px-3 pt-5">
              {/* Main */}
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Principal
              </p>
              <ul className="space-y-0.5">
                {MAIN_LINKS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
                          isActive
                            ? "ag-emerald-plate text-white"
                            : "text-white/70 hover:bg-white/[0.06] hover:text-white/90"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400/80" />
                        )}
                        <span className="text-base">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* Secondary */}
              <p className="mb-1.5 mt-6 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Más
              </p>
              <ul className="space-y-0.5">
                {SECONDARY_LINKS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
                          isActive
                            ? "ag-emerald-plate text-white"
                            : "text-white/70 hover:bg-white/[0.06] hover:text-white/90"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400/80" />
                        )}
                        <span className="text-base">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Footer / Profile */}
            <div className="mx-5 h-px bg-white/[0.08]" />
            <div className="flex items-center gap-3 px-5 pt-4">
              <span className="ag-emerald-plate flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-sm">
                🌿
              </span>
              <span className="text-sm font-medium text-white/65">Alicia</span>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  )
}
