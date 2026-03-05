import { cn } from "@/components/ui/cn"
import GlassSurface from "@/components/ui/GlassSurface"

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
  variant?: "strong" | "medium" | "soft"
}

export function Card({ className, interactive = false, variant = "medium", ...props }: CardProps) {
  return (
    <GlassSurface
      className={cn(
        "rounded-2xl text-text-primary",
        variant === "strong" && "glass-strong",
        variant === "medium" && "glass-medium",
        variant === "soft" && "glass-soft",
        interactive && "transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl",
        className
      )}
      interactive={false}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pt-4 text-text-primary", className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 p-4 text-text-primary", className)} {...props} />
}
