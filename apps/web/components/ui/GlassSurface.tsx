import { cn } from "@/components/ui/cn"

type GlassSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "strong"
  interactive?: boolean
}

export default function GlassSurface({
  children,
  className,
  variant = "default",
  interactive = false,
  ...props
}: GlassSurfaceProps) {
  const isInteractive = interactive || className?.includes("interactive")

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-glass backdrop-blur-[20px] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-10 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-white/5 after:content-['']",
        variant === "strong" && "border-white/[0.14] bg-white/10",
        isInteractive &&
          "transition-transform transition-shadow duration-200 hover:-translate-y-[1px] hover:shadow-glassStrong active:translate-y-0 active:shadow-glass",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}