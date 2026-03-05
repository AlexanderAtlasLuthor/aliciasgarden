import Image from "next/image"

export default function TabsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex justify-center">
        <Image src="/AG Logo.png" alt="Alicia's Garden" width={56} height={56} priority />
      </div>

      <section className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-ag-border/60" />
        <div className="h-4 w-64 animate-pulse rounded bg-ag-border/60" />
      </section>

      <section className="space-y-3">
        <div className="h-20 animate-pulse rounded-2xl border border-ag-border bg-ag-surface p-4 shadow-sm" />
        <div className="h-20 animate-pulse rounded-2xl border border-ag-border bg-ag-surface p-4 shadow-sm" />
      </section>
    </div>
  )
}
