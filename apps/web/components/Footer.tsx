export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="ag-container mt-6 mb-6 md:mb-28 lg:mb-6" aria-label="Pie de pagina">
      <div className="ag-emerald-plate rounded-[24px] border border-white/28 px-4 py-3 text-center shadow-[0_14px_34px_rgba(0,0,0,0.45)] lg:px-5 lg:py-2.5">
        <p className="text-[0.74rem] leading-relaxed tracking-[0.01em] text-white/75 sm:text-xs lg:text-[0.78rem]">
          &copy; {year} Alicia&apos;s Garden. App desarrollada por Fuenmayor Industries. Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  )
}