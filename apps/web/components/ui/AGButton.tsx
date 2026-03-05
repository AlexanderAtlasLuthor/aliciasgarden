import { cloneElement, forwardRef, isValidElement, type ReactElement } from "react"

import { cn } from "@/components/ui/cn"

type AGButtonVariant = "primary" | "secondary" | "ghost"

const variantClasses: Record<AGButtonVariant, string> = {
  primary:
    "text-white bg-[linear-gradient(135deg,#A6D94E,#3FA34D)] hover:scale-[1.02] hover:shadow-[var(--ag-shadow-lg)]",
  secondary:
    "bg-white/70 text-ag-ink border border-ag-border hover:bg-white/85",
  ghost:
    "bg-transparent text-ag-deep hover:bg-white/40",
}

export type AGButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  variant?: AGButtonVariant
}

export const AGButton = forwardRef<HTMLButtonElement, AGButtonProps>(function AGButton(
  { asChild = false, children, className, disabled, type = "button", variant = "primary", ...props },
  ref
) {
  const buttonClasses = cn(
    "inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ag-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60",
    disabled && "pointer-events-none",
    variantClasses[variant],
    className
  )

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child, {
      className: cn(buttonClasses, child.props.className),
    })
  }

  return (
    <button ref={ref} type={type} disabled={disabled} className={buttonClasses} {...props}>
      {children}
    </button>
  )
})
