import Image from "next/image"
import { Card, CardContent } from "@/components/ui/Card"

export default function TabsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex justify-center">
        <Image src="/AG Logo.png" alt="Alicia's Garden" width={56} height={56} priority />
      </div>

      <section className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-[var(--radius-2)] bg-neutral-300/45" />
        <div className="h-4 w-64 animate-pulse rounded-[var(--radius-2)] bg-neutral-300/45" />
      </section>

      <section className="space-y-3">
        <Card>
          <CardContent>
            <div className="h-20 animate-pulse rounded-[var(--radius-3)] bg-neutral-200/55" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="h-20 animate-pulse rounded-[var(--radius-3)] bg-neutral-200/55" />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
