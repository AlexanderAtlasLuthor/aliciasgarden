type HeaderProps = {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="max-w-md mx-auto px-4 py-3">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  )
}
