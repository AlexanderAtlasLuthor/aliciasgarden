import Image from "next/image"

type HeaderProps = {
  title: string
}

export default function Header({ title: _title }: HeaderProps) {
  return (
    <header className="pt-[max(env(safe-area-inset-top),0px)]">
      <div className="ag-container">
        <div className="flex items-center justify-center rounded-[24px] border border-white/28 bg-[#153b2f] px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/35 bg-[#2a5a4a]">
            <Image src="/AG Logo white.png" alt="AG" width={42} height={42} priority />
          </div>
        </div>
      </div>
    </header>
  )
}
