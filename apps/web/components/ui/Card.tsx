import { cn } from "@/components/ui/cn"
import GlassSurface from "@/components/ui/GlassSurface"

export type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <GlassSurface
      className={cn(
        "rounded-2xl border-white/10 bg-white/5 text-ag-ink shadow-lg backdrop-blur-[20px]",
        className
      )}
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
