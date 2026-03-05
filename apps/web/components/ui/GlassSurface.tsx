import { cn } from "@/components/ui/cn"

type GlassSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "strong" | "medium" | "soft"
  interactive?: boolean
}

export default function GlassSurface({
  children,
  className,
  variant = "medium",
  interactive = false,
  ...props
}: GlassSurfaceProps) {
  const isInteractive = interactive || className?.includes("interactive")
  const resolvedVariant = variant === "default" ? "medium" : variant

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] text-ag-ink before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-10 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-white/5 after:content-['']",
        resolvedVariant === "strong" && "glass-strong",
        resolvedVariant === "medium" && "glass-medium",
        resolvedVariant === "soft" && "glass-soft",
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