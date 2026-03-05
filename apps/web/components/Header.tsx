import Image from "next/image"

type HeaderProps = {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 px-3 pt-[max(env(safe-area-inset-top),0px)]">
      <div className="mx-auto mt-2 flex max-w-md items-center gap-3 rounded-[var(--radius-5)] border border-border-weak bg-surface-glass-2 px-4 py-3.5 shadow-2 backdrop-blur-md">
        <Image src="/AG Logo.png" alt="Alicia's Garden" width={40} height={40} priority />
        <h1 className="text-[1.02rem] font-semibold tracking-[0.01em] text-neutral-900">{title}</h1>
      </div>
    </header>
  )
}
