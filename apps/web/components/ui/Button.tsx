import { cloneElement, forwardRef, isValidElement, type ReactElement } from "react"

import { cn } from "@/components/ui/cn"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md"

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ag-primary text-white hover:brightness-95 active:brightness-90 focus-visible:ring-ag-primary",
  secondary:
    "bg-ag-secondary text-ag-text hover:brightness-95 active:brightness-90 focus-visible:ring-ag-primary",
  ghost:
    "border border-ag-border bg-transparent text-ag-primary hover:bg-ag-surface active:brightness-95 focus-visible:ring-ag-primary",
  danger:
    "bg-ag-danger text-white hover:brightness-95 active:brightness-90 focus-visible:ring-ag-danger",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
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
    "inline-flex items-center justify-center rounded-xl font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ag-bg disabled:cursor-not-allowed disabled:opacity-60",
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
