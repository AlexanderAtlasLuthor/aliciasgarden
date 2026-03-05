import { forwardRef } from "react"

import { cn } from "@/components/ui/cn"

export type AGInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const AGInput = forwardRef<HTMLInputElement, AGInputProps>(function AGInput(
  { className, ...props },
  ref
) {
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true"

  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl bg-white/60 backdrop-blur border border-ag-border px-3 py-2 text-sm text-ag-ink outline-none transition focus-visible:ring-2 focus-visible:ring-ag-primary",
        isInvalid && "border-ag-danger focus-visible:ring-ag-danger",
        className
      )}
      {...props}
    />
  )
})
