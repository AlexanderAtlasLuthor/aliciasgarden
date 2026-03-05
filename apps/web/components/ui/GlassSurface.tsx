import { cn } from "@/components/ui/cn"

type GlassSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "strong"
}

export default function GlassSurface({
  children,
  className,
  variant = "default",
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-[20px] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-10 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:content-['']",
        variant === "strong" && "border-white/[0.14] bg-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}