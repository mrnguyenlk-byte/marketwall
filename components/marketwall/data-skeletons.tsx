import { cn } from "@/lib/utils"

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted/80", className)} />
}

export function TickerBarSkeleton({ count = 8, compact = false }: { count?: number; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-full items-stretch border-t border-border bg-surface-elevated",
        compact && "max-h-7",
      )}
    >
      <div className="z-10 flex shrink-0 items-center border-r border-border bg-surface-muted px-2">
        <Bone className="h-2.5 w-8" />
      </div>
      <div className={cn("flex flex-1 items-center gap-3 overflow-hidden px-3", compact ? "py-0.5" : "py-2")}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2">
            <Bone className="size-5 rounded-full" />
            <Bone className="h-3 w-14" />
            <Bone className="h-3 w-12" />
            <Bone className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function OverviewListSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className="min-h-0 flex-1 divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-2 px-3 py-2">
          <Bone className="size-7 shrink-0 rounded-full" />
          <Bone className="h-3 flex-1" />
          <Bone className="h-4 w-10 shrink-0" />
          <div className="shrink-0 space-y-1 text-right">
            <Bone className="ml-auto h-3 w-12" />
            <Bone className="ml-auto h-2.5 w-10" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function HeatmapGridSkeleton() {
  return (
    <div className="grid h-full grid-cols-6 gap-px bg-heatmap-gap p-px sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
      {Array.from({ length: 48 }).map((_, i) => (
        <Bone
          key={i}
          className={cn(
            "min-h-[48px] rounded-none",
            i % 11 === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
          )}
        />
      ))}
    </div>
  )
}

export function NewsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-start gap-2.5 px-3 py-2.5">
          <Bone className="size-7 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-4/5" />
            <Bone className="h-2.5 w-16" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function CalendarListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="grid grid-cols-[auto_1fr] gap-x-3 px-4 py-2.5 sm:grid-cols-[auto_1fr_auto_auto_auto]">
          <Bone className="h-3 w-10" />
          <Bone className="h-3 w-full" />
          <Bone className="col-start-2 h-3 w-12 sm:col-start-auto" />
          <Bone className="hidden h-3 w-10 sm:block" />
          <Bone className="hidden h-3 w-10 sm:block" />
        </li>
      ))}
    </ul>
  )
}
