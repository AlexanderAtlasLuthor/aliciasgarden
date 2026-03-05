import AppShell from "@/components/AppShell"

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ag-tabs-layout">
      <AppShell title="Alicia's Garden">{children}</AppShell>
    </div>
  )
}
