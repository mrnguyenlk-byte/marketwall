"use client"

import { useLang } from "@/lib/i18n"
import { fgLabel, type FearGreedItem } from "@/lib/fear-greed"
import { cn } from "@/lib/utils"

function sentimentTone(value: number) {
  if (value < 25) return "loss"
  if (value < 45) return "warn"
  if (value < 55) return "neutral"
  if (value < 75) return "gain"
  return "gain"
}

function sentimentColor(value: number) {
  const tone = sentimentTone(value)
  if (tone === "loss") return "var(--loss)"
  if (tone === "warn") return "var(--warn)"
  if (tone === "neutral") return "var(--neutral)"
  return "var(--gain)"
}

function Gauge({ value, compact = false }: { value: number; compact?: boolean }) {
  const r = compact ? 36 : 44
  const cx = 60
  const cy = compact ? 46 : 50
  const angle = 180 - (value / 100) * 180
  const rad = (angle * Math.PI) / 180
  const nx = cx + r * Math.cos(rad)
  const ny = cy - r * Math.sin(rad)

  const segments = [
    { from: 0, to: 25, color: "var(--loss)" },
    { from: 25, to: 45, color: "var(--warn)" },
    { from: 45, to: 55, color: "var(--neutral)" },
    { from: 55, to: 75, color: "#7cb342" },
    { from: 75, to: 100, color: "var(--gain)" },
  ]

  function arc(from: number, to: number) {
    const a1 = ((180 - (from / 100) * 180) * Math.PI) / 180
    const a2 = ((180 - (to / 100) * 180) * Math.PI) / 180
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy - r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2)
    const y2 = cy - r * Math.sin(a2)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }

  const needleColor = sentimentColor(value)

  return (
    <svg
      viewBox="0 0 120 54"
      className={cn("mx-auto w-full max-w-[120px]", compact ? "h-[44px]" : "h-[56px]")}
      aria-hidden
    >
      {segments.map((s, i) => (
        <path
          key={i}
          d={arc(s.from, s.to)}
          fill="none"
          stroke={s.color}
          strokeWidth="7"
          strokeLinecap="butt"
        />
      ))}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={needleColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3" fill={needleColor} />
    </svg>
  )
}

export function FearGreed({
  items,
  variant = "default",
}: {
  items: FearGreedItem[]
  variant?: "default" | "sidebar"
}) {
  const { t } = useLang()
  const compact = variant === "sidebar"

  return (
    <section
      aria-labelledby="fg-title"
      className={cn(compact ? "h-[220px]" : "h-[200px]")}
    >
      <div className={cn("mb-1.5 flex items-center gap-2", compact && "mb-1")}>
        <span className="h-3.5 w-0.5 rounded-full bg-primary" aria-hidden />
        <h2 id="fg-title" className="text-xs font-semibold text-foreground sm:text-sm">
          {t("sec.fearGreed")}
        </h2>
      </div>
      <div
        className={cn(
          "grid grid-cols-3 gap-0 overflow-hidden rounded-lg border border-border bg-card",
          compact ? "h-[188px]" : "h-[172px]",
        )}
      >
        {items.map((g) => {
          const labelKey = fgLabel(g.value)
          const tone = sentimentTone(g.value)
          return (
            <div
              key={g.key}
              className={cn(
                "flex flex-col items-center justify-center border-r border-border last:border-r-0",
                compact ? "px-1.5 py-1" : "px-3 py-2",
              )}
            >
              <p className={cn("font-semibold text-foreground", compact ? "text-[10px]" : "text-xs")}>
                {t(g.key)}
              </p>
              <div className="relative w-full py-0.5">
                <Gauge value={g.value} compact={compact} />
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 text-center font-mono font-bold tabular-nums",
                    compact ? "text-base" : "text-xl",
                    tone === "loss" && "text-loss",
                    tone === "warn" && "text-warn",
                    tone === "neutral" && "text-foreground",
                    tone === "gain" && "text-gain",
                  )}
                >
                  {g.value}
                </span>
              </div>
              <p
                className={cn(
                  "font-semibold",
                  compact ? "mt-0.5 text-[10px]" : "mt-1 text-xs",
                  tone === "loss" && "text-loss",
                  tone === "warn" && "text-warn",
                  tone === "neutral" && "text-muted-foreground",
                  tone === "gain" && "text-gain",
                )}
              >
                {t(labelKey)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
