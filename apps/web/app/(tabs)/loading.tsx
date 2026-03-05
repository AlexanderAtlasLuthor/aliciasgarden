export default function TabsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <section className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
      </section>

      <section className="space-y-3">
        <div className="h-20 animate-pulse rounded-2xl border bg-white p-4" />
        <div className="h-20 animate-pulse rounded-2xl border bg-white p-4" />
      </section>
    </div>
  )
}
