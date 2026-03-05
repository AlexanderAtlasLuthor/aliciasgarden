import { cloneElement, forwardRef, isValidElement, type ReactElement } from "react"

import { cn } from "@/components/ui/cn"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md"

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-brand-500/35 bg-[linear-gradient(135deg,var(--brand-500),var(--brand-700))] text-neutral-0 shadow-brand hover:brightness-105 active:brightness-95 focus-visible:ring-brand-500",
  secondary:
    "border border-border-md bg-surface-glass-3 text-neutral-900 shadow-1 backdrop-blur-sm hover:bg-neutral-0/85 active:bg-neutral-0/75 focus-visible:ring-brand-500",
  ghost:
    "border border-border-weak bg-neutral-0/15 text-brand-800 backdrop-blur-sm hover:bg-neutral-0/35 active:bg-neutral-0/20 focus-visible:ring-brand-500",
  danger:
    "border border-red-600/35 bg-[linear-gradient(135deg,#de4b41,#b42318)] text-neutral-0 shadow-2 hover:brightness-105 active:brightness-95 focus-visible:ring-red-500",
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
    "inline-flex items-center justify-center rounded-[var(--radius-3)] font-semibold tracking-[0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60",
    disabled && "pointer-events-none opacity-60",
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
