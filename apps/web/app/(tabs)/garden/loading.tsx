import { Card, CardContent } from "@/components/ui/Card"

export default function GardenLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <section className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded-[var(--radius-2)] bg-neutral-300/45" />
        <div className="h-4 w-72 animate-pulse rounded-[var(--radius-2)] bg-neutral-300/45" />
      </section>

      <div className="h-11 w-full animate-pulse rounded-[var(--radius-3)] bg-neutral-300/45" />

      <section className="space-y-3">
        <Card>
          <CardContent>
            <div className="h-24 animate-pulse rounded-[var(--radius-3)] bg-neutral-200/55" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="h-24 animate-pulse rounded-[var(--radius-3)] bg-neutral-200/55" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="h-24 animate-pulse rounded-[var(--radius-3)] bg-neutral-200/55" />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
