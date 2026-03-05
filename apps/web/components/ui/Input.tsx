import { forwardRef } from "react"

import { cn } from "@/components/ui/cn"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-3)] border border-ag-borderB bg-ag-glass1 px-3.5 py-2.5 text-sm text-ag-ink shadow-ag1 backdrop-blur-ag outline-none transition duration-200 placeholder:text-ag-faint focus:border-[color:var(--ag-brand-ring-40)] focus:ring-2 focus:ring-[color:var(--ag-brand-ring-25)] focus:ring-offset-0 aria-[invalid=true]:border-red-300/40 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-300/20",
        className
      )}
      {...props}
    />
  )
})

export default Input
