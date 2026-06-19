import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusBadgeProps = {
  status?: string | null
  /** Shown after "Failed:" when status is failed */
  detail?: string | null
  className?: string
}

export function StatusBadge({ status, detail, className }: StatusBadgeProps) {
  const value = status ?? "unknown"
  const variant =
    value === "sent" || value === "published" || value === "success"
      ? "default"
      : value === "failed"
        ? "destructive"
        : value === "skipped" || value === "draft"
          ? "secondary"
          : "outline"

  const label =
    value === "failed" && detail?.trim()
      ? `Failed: ${detail.trim()}`
      : value

  return (
    <Badge
      variant={variant}
      className={cn(detail?.trim() && value === "failed" ? "" : "capitalize", className)}
      title={detail?.trim() && value === "failed" ? detail : undefined}
    >
      {label}
    </Badge>
  )
}
