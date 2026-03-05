"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type HeaderProps = {
  title: string
}

const DRAWER_LINKS = [
  { label: "Inicio", href: "/home" },
  { label: "Toni", href: "/toni" },
  { label: "Jardín", href: "/garden" },
  { label: "Plan", href: "/plan" },
  { label: "Ajustes", href: "/settings" }
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

  return (
    <header className="relative z-40">
      <div className="ag-container">
        <div className="relative flex items-center justify-center rounded-[24px] border border-white/28 bg-[#153b2f] px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setIsDrawerOpen(true)}
            className="absolute left-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/90 transition hover:bg-white/10 md:hidden"
          >
            <span className="text-lg leading-none">☰</span>
          </button>

          <div className="flex min-w-0 flex-col items-center justify-center gap-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/35 bg-[#2a5a4a]">
              <Image src="/ag-logo-white.png" alt="AG" width={42} height={42} priority unoptimized />
            </div>
            <span className="text-primary text-xs font-medium tracking-[0.02em] md:hidden">{title}</span>
          </div>

          <span className="absolute right-3 h-10 w-10 md:hidden" aria-hidden="true" />
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
            className="relative h-full w-[82vw] max-w-[20rem] border-r border-white/18 bg-[rgba(12,34,27,0.88)] px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),1rem)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="text-primary text-sm font-semibold tracking-[0.03em]">Navegación</p>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-white/85 transition hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            <nav className="space-y-2">
              {DRAWER_LINKS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`block rounded-2xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? "border-white/35 bg-white/12 text-white"
                        : "border-white/12 bg-white/5 text-white/85 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  )
}
