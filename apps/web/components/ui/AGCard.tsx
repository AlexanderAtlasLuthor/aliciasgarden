import { AGGlass, type AGGlassProps } from "@/components/ui/AGGlass"
import { cn } from "@/components/ui/cn"

export type AGCardProps = AGGlassProps

export function AGCard({ className, ...props }: AGCardProps) {
  return <AGGlass className={cn("p-4 sm:p-5", className)} {...props} />
}

export function AGCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pb-3", className)} {...props} />
}

export function AGCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />
}

export function AGCardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-4", className)} {...props} />
}
