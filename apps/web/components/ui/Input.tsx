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
        "w-full rounded-[var(--radius-3)] border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-white/85 shadow-glass backdrop-blur-ag outline-none transition-all duration-200 placeholder:text-white/40 focus:border-ag-neon focus:ring-2 focus:ring-[rgba(124,255,180,0.22)] focus:ring-offset-0 aria-[invalid=true]:border-red-400/30 aria-[invalid=true]:shadow-[0_0_0_3px_rgba(255,90,90,0.12)]",
        className
      )}
      {...props}
    />
  )
})

export default Input
