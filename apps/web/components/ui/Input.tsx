import { forwardRef } from "react"

import { cn } from "@/components/ui/cn"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true"

  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-3)] border border-border-md bg-surface-glass-3 px-3.5 py-2.5 text-sm text-neutral-900 shadow-1 backdrop-blur-sm outline-none transition duration-200 placeholder:text-neutral-600 focus-visible:border-brand-500/60 focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-0",
        isInvalid && "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/60",
        className
      )}
      {...props}
    />
  )
})

export default Input
