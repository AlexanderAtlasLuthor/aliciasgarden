import { cn } from "@/components/ui/cn"
import GlassSurface from "@/components/ui/GlassSurface"

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <GlassSurface
      className={cn(
        "rounded-2xl border-white/10 bg-white/6 text-ag-ink shadow-glass backdrop-blur-[20px]",
        className
      )}
      interactive={interactive}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pt-4 text-ag-ink", className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 text-ag-muted", className)} {...props} />
}
