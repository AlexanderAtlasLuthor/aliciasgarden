import Header from "@/components/Header"
import TabBar from "@/components/TabBar"

type AppShellProps = {
  title: string
  children: React.ReactNode
}

export default function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="min-h-dvh pb-[max(env(safe-area-inset-bottom),0px)]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-300/35 blur-3xl" />
        <div className="absolute right-[-80px] top-1/3 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-[-70px] left-[-40px] h-52 w-52 rounded-full bg-neutral-0/45 blur-3xl" />
      </div>

      <Header title={title} />

      <main className="mx-auto mt-3 flex w-full max-w-md flex-col space-y-6">
        {children}
      </main>

      <TabBar />
    </div>
  )
}
