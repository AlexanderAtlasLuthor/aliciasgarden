import Header from "@/components/Header"
import TabBar from "@/components/TabBar"

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <Header title="Alicia’s Garden" />
      <main className="max-w-md mx-auto px-4 py-4 pb-20">{children}</main>
      <TabBar />
    </div>
  )
}
