import { cn } from "@/components/ui/cn"

export type AGGlassProps = React.HTMLAttributes<HTMLDivElement>

export function AGGlass({ className, ...props }: AGGlassProps) {
  return (
    <div
      className={cn(
        "bg-ag-glass backdrop-blur-xl border border-ag-border rounded-[24px] shadow-[var(--ag-shadow-md)]",
        className
      )}
      {...props}
    />
  )
}
