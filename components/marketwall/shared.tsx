"use client"

import type { ReactNode } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: n >= 100 ? 1 : 4,
    minimumFractionDigits: 0,
    ...opts,
  }).format(n)
}

/** Display prices without insignificant trailing decimals (153.0 â†’ 153). */
export function formatMarketPrice(n: number, marketType: "vn" | "us" | "crypto") {
  return fmt(n, {
    maximumFractionDigits: marketType === "vn" ? 0 : marketType === "crypto" ? 4 : 2,
    minimumFractionDigits: 0,
  })
}

export function signClass(v: number) {
  return v > 0 ? "text-gain" : v < 0 ? "text-loss" : "text-muted-foreground"
}

export function ChangePill({
  value,
  suffix = "%",
  showIcon = true,
  className,
}: {
  value: number
  suffix?: string
  showIcon?: boolean
  className?: string
}) {
  const up = value > 0
  const down = value < 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums",
        up && "bg-gain/15 text-gain",
        down && "bg-loss/15 text-loss",
        !up && !down && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {showIcon && up && <ArrowUp className="size-3" aria-hidden />}
      {showIcon && down && <ArrowDown className="size-3" aria-hidden />}
      {up ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  )
}

// Lightweight deterministic SVG sparkline.
export function Sparkline({
  data,
  positive,
  className,
  width = 100,
  height = 32,
}: {
  data: number[]
  positive: boolean
  className?: string
  width?: number
  height?: number
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data
    .map((d, i) => {
      const x = i * step
      const y = height - ((d - min) / range) * (height - 4) - 2
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")
  const color = positive ? "var(--gain)" : "var(--loss)"
  const id = `spark-${Math.round(data[0] * 100)}-${data.length}-${positive}`
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${id})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Unified dashboard card shell â€” radius, border, shadow, min-w-0. */
export function DashboardCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm ring-1 ring-border/80",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DashboardCardBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("min-w-0", className)} {...props}>
      {children}
    </div>
  )
}

export function DashboardCardFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 border-t border-border bg-card/60 px-3 py-2 type-secondary-label text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** In-card widget header â€” fixed height band, title + optional action. */
export function WidgetHeader({
  title,
  id,
  badge,
  action,
  leading,
  children,
  className,
}: {
  title?: string
  id?: string
  badge?: ReactNode
  action?: ReactNode
  /** Custom title row content (replaces title string). */
  leading?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const hasTitleRow = title || badge || leading

  return (
    <div
      className={cn(
        "flex min-h-9 min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-card/90 to-card/60 px-3 py-2",
        className,
      )}
    >
      {hasTitleRow ? (
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-primary" aria-hidden />
          {leading ?? (
            title ? (
              <h2 id={id} className="type-widget-title truncate tracking-tight text-foreground">
                {title}
              </h2>
            ) : null
          )}
          {badge}
        </div>
      ) : null}
      {action}
      {children}
    </div>
  )
}

export function SectionHeading({
  title,
  subtitle,
  badge,
  action,
  id,
}: {
  title: string
  subtitle?: string
  badge?: ReactNode
  action?: ReactNode
  id?: string
}) {
  return (
    <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-primary" aria-hidden />
          <h2
            id={id}
            className="type-widget-title truncate tracking-tight text-foreground"
          >
            {title}
          </h2>
          {badge}
        </div>
        {subtitle ? (
          <p className="pl-[calc(0.5rem+2px)] text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

// Maps a percent change to a heatmap background color via inline style.
export function heatStyle(pct: number): React.CSSProperties {
  const clamped = Math.max(-5, Math.min(5, pct))

  const stops: [number, number, number, number][] = [
    [-5, 120, 45, 38],
    [-2, 156, 58, 45],
    [-0.5, 182, 76, 50],
    [-0.05, 123, 66, 57],
    [0, 58, 73, 92],
    [0.15, 58, 113, 67],
    [0.8, 46, 137, 60],
    [1.5, 37, 117, 48],
    [2.5, 27, 96, 42],
    [3.5, 18, 79, 37],
    [5, 13, 105, 45],
  ]

  if (clamped <= stops[0][0]) return { backgroundColor: rgb(stops[0]) }
  if (clamped >= stops[stops.length - 1][0]) {
    return { backgroundColor: rgb(stops[stops.length - 1]) }
  }

  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, r0, g0, b0] = stops[i]
    const [p1, r1, g1, b1] = stops[i + 1]
    if (clamped >= p0 && clamped <= p1) {
      const t = (clamped - p0) / (p1 - p0)
      return {
        backgroundColor: `rgb(${lerp(r0, r1, t)}, ${lerp(g0, g1, t)}, ${lerp(b0, b1, t)})`,
      }
    }
  }

  return { backgroundColor: "rgb(58, 73, 92)" }
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

function rgb(stop: [number, number, number, number]) {
  return `rgb(${stop[1]}, ${stop[2]}, ${stop[3]})`
}

