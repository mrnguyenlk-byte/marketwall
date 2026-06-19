import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusBadgeProps = {
  status?: string | null
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const value = status ?? "unknown"
  const variant =
    value === "sent" || value === "published" || value === "success"
      ? "default"
      : value === "failed"
        ? "destructive"
        : value === "skipped" || value === "draft"
          ? "secondary"
          : "outline"

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {value}
    </Badge>
  )
}
