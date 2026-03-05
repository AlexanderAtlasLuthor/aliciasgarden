import { Card, CardContent } from "@/components/ui/Card"

export default function ToniLoading() {
  return (
    <div className="space-y-4 pb-24" aria-busy="true" aria-live="polite">
      <section className="space-y-2">
        <div className="h-7 w-20 animate-pulse rounded-[var(--radius-2)] bg-neutral-300/45" />
        <div className="h-4 w-72 animate-pulse rounded-[var(--radius-2)] bg-neutral-300/45" />
      </section>

      <section className="space-y-3">
        <Card className="w-3/4">
          <CardContent>
            <div className="h-16 animate-pulse rounded-[var(--radius-3)] bg-neutral-200/55" />
          </CardContent>
        </Card>
        <div className="ml-auto h-16 w-2/3 animate-pulse rounded-[var(--radius-4)] bg-brand-200/50" />
        <Card className="w-4/5">
          <CardContent>
            <div className="h-16 animate-pulse rounded-[var(--radius-3)] bg-neutral-200/55" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="h-10 w-full animate-pulse rounded-[var(--radius-3)] bg-neutral-200/55" />
        </CardContent>
      </Card>
    </div>
  )
}
