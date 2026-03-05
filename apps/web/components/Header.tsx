import Image from "next/image"

import GlassSurface from "@/components/ui/GlassSurface"

type HeaderProps = {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="pt-[max(env(safe-area-inset-top),0px)]">
      <div className="ag-container">
        <GlassSurface
          className="flex items-center justify-center gap-3 rounded-[24px] border-white/25 bg-white/18 px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.42)]"
          variant="strong"
        >
          <Image src="/AG Logo.png" alt="Alicia's Garden" width={32} height={32} priority />
          <h1 className="text-ag-body text-text-primary ag-balance text-center font-semibold tracking-tight">{title}</h1>
        </GlassSurface>
      </div>
    </header>
  )
}
