import { cloneElement, forwardRef, isValidElement, type ReactElement } from "react"

import { cn } from "@/components/ui/cn"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md"

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-ag-borderA bg-gradient-to-br from-ag-brand2 to-ag-brandDeep text-ag-ink shadow-agGlow hover:brightness-110 active:brightness-95",
  secondary:
    "border border-ag-borderB bg-ag-glass1 text-white/85 shadow-ag1 backdrop-blur-ag hover:bg-ag-glass2 active:bg-ag-glass3",
  ghost:
    "border border-ag-borderB bg-ag-glass1 text-white/85 backdrop-blur-ag hover:bg-ag-glass2 active:bg-ag-glass3",
  danger:
    "border border-red-300/40 bg-[linear-gradient(135deg,#de4b41,#b42318)] text-ag-ink shadow-ag1 hover:brightness-105 active:brightness-95",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-2 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm",
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    asChild = false,
    children,
    className,
    disabled,
    variant = "primary",
    size = "md",
    type = "button",
    ...props
  },
  ref
) {
  const buttonClasses = cn(
    "inline-flex items-center justify-center rounded-[var(--radius-3)] font-semibold tracking-[0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ag-brand-ring-40)] focus-visible:ring-offset-0 active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-50",
    disabled && "pointer-events-none opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  )

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child, {
      className: cn(buttonClasses, child.props.className),
    })
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  )
})

export default Button
