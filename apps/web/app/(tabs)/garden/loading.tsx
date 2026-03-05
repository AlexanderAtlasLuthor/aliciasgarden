export default function GardenLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <section className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
      </section>

      <div className="h-11 w-full animate-pulse rounded-xl bg-gray-200" />

      <section className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl border bg-white p-4" />
        <div className="h-24 animate-pulse rounded-2xl border bg-white p-4" />
        <div className="h-24 animate-pulse rounded-2xl border bg-white p-4" />
      </section>
    </div>
  )
}
