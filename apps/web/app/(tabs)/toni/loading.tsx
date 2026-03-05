export default function ToniLoading() {
  return (
    <div className="space-y-4 pb-24" aria-busy="true" aria-live="polite">
      <section className="space-y-2">
        <div className="h-7 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
      </section>

      <section className="space-y-3">
        <div className="h-16 w-3/4 animate-pulse rounded-2xl border bg-white" />
        <div className="ml-auto h-16 w-2/3 animate-pulse rounded-2xl bg-green-100" />
        <div className="h-16 w-4/5 animate-pulse rounded-2xl border bg-white" />
      </section>

      <div className="rounded-2xl border bg-white p-3">
        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  )
}
