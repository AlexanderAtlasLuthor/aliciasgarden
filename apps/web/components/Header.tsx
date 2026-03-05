import Image from "next/image"

import GlassSurface from "@/components/ui/GlassSurface"

type HeaderProps = {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-3 z-20 px-4 pt-[max(env(safe-area-inset-top),0px)]">
      <div className="mx-auto max-w-md">
        <GlassSurface className="flex items-center gap-3 rounded-[24px] px-4 py-3" variant="strong">
          <Image src="/AG Logo.png" alt="Alicia's Garden" width={32} height={32} priority />
          <h1 className="text-base font-medium tracking-tight text-white/90">{title}</h1>
        </GlassSurface>
      </div>
    </header>
  )
}
