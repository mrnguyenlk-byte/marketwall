"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: n >= 100 ? 1 : 4,
    minimumFractionDigits: n >= 100 ? 1 : 2,
    ...opts,
  }).format(n)
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

export function SectionHeading({
  title,
  badge,
  action,
}: {
  title: string
  badge?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-primary" aria-hidden />
        <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
          {title}
        </h2>
        {badge}
      </div>
      {action}
    </div>
  )
}

// Maps a percent change to a heatmap background color via inline style.
export function heatStyle(pct: number): React.CSSProperties {
  const clamped = Math.max(-5, Math.min(5, pct))

  const stops: [number, number, number, number][] = [
    [-5, 125, 48, 38],
    [-2, 155, 62, 45],
    [-0.5, 185, 90, 55],
    [-0.05, 200, 130, 60],
    [0, 210, 175, 48],
    [0.15, 155, 168, 58],
    [0.8, 75, 145, 55],
    [1.5, 42, 118, 48],
    [2.5, 28, 98, 42],
    [3.5, 18, 82, 38],
    [5, 14, 115, 48],
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

  return { backgroundColor: "rgb(210, 175, 48)" }
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

function rgb(stop: [number, number, number, number]) {
  return `rgb(${stop[1]}, ${stop[2]}, ${stop[3]})`
}
