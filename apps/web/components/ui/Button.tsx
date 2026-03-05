import { cloneElement, forwardRef, isValidElement, type ReactElement } from "react"

import { cn } from "@/components/ui/cn"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md"

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-white/10 bg-[linear-gradient(135deg,rgba(90,255,170,0.35),rgba(20,160,90,0.35))] text-primary shadow-glow hover:-translate-y-[1px] hover:shadow-glowStrong active:translate-y-0 active:shadow-glow",
  secondary:
    "border border-white/10 bg-white/6 text-white/85 shadow-glass backdrop-blur-ag hover:bg-white/10 active:bg-white/10",
  ghost:
    "border border-white/10 bg-white/6 text-secondary backdrop-blur-ag hover:bg-white/10 hover:text-primary active:bg-white/10",
  danger:
    "border border-red-300/40 bg-[linear-gradient(135deg,#de4b41,#b42318)] text-white shadow-glass hover:brightness-105 active:brightness-95",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-2 text-[0.75rem]",
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
    "inline-flex items-center justify-center rounded-[var(--radius-3)] font-semibold tracking-[0.01em] transition-all duration-200 ag-focus-ring active:translate-y-[1px] disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45",
    disabled && "pointer-events-none opacity-45",
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
