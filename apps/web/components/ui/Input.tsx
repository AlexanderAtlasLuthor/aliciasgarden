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
        "w-full rounded-xl border border-ag-border bg-ag-surface px-3 py-2 text-sm text-ag-text outline-none transition focus-visible:ring-2 focus-visible:ring-ag-primary focus-visible:ring-offset-1",
        isInvalid && "border-ag-danger focus-visible:ring-ag-danger",
        className
      )}
      {...props}
    />
  )
})

export default Input
