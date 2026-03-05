import Image from "next/image"

type HeaderProps = {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="border-b border-ag-border bg-ag-surface">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        <Image src="/AG Logo.png" alt="Alicia's Garden" width={36} height={36} priority />
        <h1 className="text-lg font-semibold text-ag-text">{title}</h1>
      </div>
    </header>
  )
}
